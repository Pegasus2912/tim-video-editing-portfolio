const crypto = require("crypto"), { db, limited, ip, send, originOk, mail, wrap } = require("./_lib"), { adminUser } = require("./_admin"), { V, getContent } = require("./_content");
const STATUS = ["pending_payment", "paid", "confirmed", "in_progress", "waiting_for_customer", "completed", "cancelled"], UUID = /^[0-9a-f-]{36}$/;
const LIST = "id,order_number,status,payment_status,customer_name,customer_email,package_name,amount_cents,created_at";
const FULL = LIST + ",service,video_type,video_length,game,reference_links,preferences,subtitles,notes,paid_at";
module.exports = wrap("admin", async (req, res) => {
  const e = process.env;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY || !e.ADMIN_EMAIL) return send(res, 503, { error: "Admin is not configured." });
  if (!originOk(req) || !/^application\/json/.test(req.headers["content-type"] || "")) return send(res, 403, { error: "Forbidden" });
  if (limited("adm" + ip(req), 200, 600000)) return send(res, 429, { error: "Too many requests" });
  if (!(await adminUser(req))) return send(res, 401, { error: "Unauthorized" }); // checked on EVERY call
  const b = req.body || {}, d = db(), id = b.id;
  if (["order", "setStatus", "reply"].includes(b.action) && !UUID.test(String(id))) return send(res, 400, { error: "Invalid id" });
  if (b.action === "overview") {
    const { data: o } = await d.from("orders").select("id,order_number,status,customer_name,created_at").order("created_at", { ascending: false }).limit(1000);
    const { count } = await d.from("messages").select("id", { count: "exact", head: true }).eq("sender", "customer").eq("read_by_admin", false);
    const counts = {}; (o || []).forEach((x) => { counts[x.status] = (counts[x.status] || 0) + 1; });
    return send(res, 200, { total: (o || []).length, counts, unread: count || 0, recent: (o || []).slice(0, 8) });
  }
  if (b.action === "orders") {
    const { data: o } = await d.from("orders").select(LIST).order("created_at", { ascending: false }).limit(500);
    const { data: m } = await d.from("messages").select("order_id").eq("sender", "customer").eq("read_by_admin", false), un = {};
    (m || []).forEach((x) => { un[x.order_id] = (un[x.order_id] || 0) + 1; });
    return send(res, 200, { orders: (o || []).map((x) => ({ ...x, unread: un[x.id] || 0 })) });
  }
  const MEDIA = { video: { dir: "videos", mime: { "video/mp4": "mp4", "video/webm": "webm" }, max: 52428800 }, thumb: { dir: "thumbs", mime: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }, max: 5242880 } };
  if (b.action === "uploadUrl") { // one-time signed upload URL; the file name is chosen by the server, never by the client
    const m = MEDIA[b.kind], ext = m && m.mime[b.contentType];
    if (!ext) return send(res, 400, { error: "File type not allowed." });
    if (!Number.isInteger(b.size) || b.size < 1 || b.size > m.max) return send(res, 400, { error: "File too large or empty." });
    if (limited("up" + ip(req), 20, 600000)) return send(res, 429, { error: "Too many requests" });
    const path = `${m.dir}/${crypto.randomUUID()}.${ext}`, { data, error } = await d.storage.from("media").createSignedUploadUrl(path);
    if (error || !data) return send(res, 500, { error: "Could not prepare the upload." });
    return send(res, 200, { signedUrl: data.signedUrl, url: d.storage.from("media").getPublicUrl(path).data.publicUrl });
  }
  if (b.action === "mediaCleanup") { // deletes uploaded files that no saved portfolio entry uses any more
    const cur = (await getContent("projects")) || [], used = new Set(cur.flatMap((x) => [x.file, x.thumb]).map((u) => String(u).split("/media/")[1]).filter(Boolean)); let n = 0;
    for (const dir of ["videos", "thumbs"]) { const { data } = await d.storage.from("media").list(dir, { limit: 1000 }), rm = (data || []).map((f) => dir + "/" + f.name).filter((p) => !used.has(p) && /^(videos|thumbs)\/[0-9a-f-]{36}\.\w+$/.test(p)); if (rm.length) { await d.storage.from("media").remove(rm); n += rm.length; } }
    return send(res, 200, { deleted: n });
  }
  if (b.action === "customers") {
    const { data: u } = await d.auth.admin.listUsers({ page: 1, perPage: 200 }), { data: o } = await d.from("orders").select("user_id").not("user_id", "is", null), n = {}, ae = e.ADMIN_EMAIL.toLowerCase();
    (o || []).forEach((x) => { n[x.user_id] = (n[x.user_id] || 0) + 1; });
    return send(res, 200, { customers: ((u && u.users) || []).filter((x) => (x.email || "").toLowerCase() !== ae).map((x) => ({ id: x.id, email: x.email, name: (x.user_metadata && x.user_metadata.name) || "", created_at: x.created_at, orders: n[x.id] || 0, status: x.banned_until ? "disabled" : x.email_confirmed_at ? "verified" : "unverified" })) });
  }
  if (b.action === "customerOrders") { if (!UUID.test(String(id))) return send(res, 400, { error: "Invalid id" }); const { data } = await d.from("orders").select(LIST).eq("user_id", id).order("created_at", { ascending: false }); return send(res, 200, { orders: data || [] }); }
  if (b.action === "contentGet") { if (!V[b.key]) return send(res, 400, { error: "Unknown key" }); return send(res, 200, { value: await getContent(b.key) }); }
  if (b.action === "contentSet") {
    const val = V[b.key] ? V[b.key](b.value) : null; if (val == null) return send(res, 400, { error: "Invalid data. Please check all fields." });
    const { error } = await d.from("site_content").upsert({ key: b.key, value: val, updated_at: new Date().toISOString() }); return error ? send(res, 500, { error: "Save failed" }) : send(res, 200, { ok: true });
  }
  const { data: ord } = UUID.test(String(id)) ? await d.from("orders").select(FULL).eq("id", id).maybeSingle() : { data: null };
  if (!ord) return send(res, 404, { error: "Not found" });
  if (b.action === "order") {
    await d.from("messages").update({ read_by_admin: true }).eq("order_id", id).eq("sender", "customer").eq("read_by_admin", false);
    const { data: m } = await d.from("messages").select("id,sender,body,created_at").eq("order_id", id).order("created_at");
    return send(res, 200, { order: ord, messages: m || [] });
  }
  if (b.action === "setStatus") {
    if (!STATUS.includes(b.status)) return send(res, 400, { error: "Invalid status" });
    if (!["cancelled", "pending_payment"].includes(b.status) && ord.payment_status !== "paid") return send(res, 400, { error: "Order is not paid (verified by Stripe)." });
    const { error } = await d.from("orders").update({ status: b.status }).eq("id", id);
    if (error) return send(res, 500, { error: "Update failed" });
    await mail(ord.customer_email, `Order ${ord.order_number}: status updated`, `The status of your order ${ord.order_number} changed to: ${b.status.replaceAll("_", " ")}. Details: ${e.SITE_URL}/account.html`);
    return send(res, 200, { ok: true });
  }
  if (b.action === "reply") {
    if (typeof b.body !== "string" || b.body.trim().length < 1 || b.body.length > 4000) return send(res, 400, { error: "Invalid message" });
    const { error } = await d.from("messages").insert({ order_id: id, sender: "admin", body: b.body.trim(), read_by_admin: true });
    if (error) return send(res, 500, { error: "Could not send" });
    await mail(ord.customer_email, `New reply on order ${ord.order_number}`, `You have a new message from Pegasus2912 on order ${ord.order_number}. Please open your order page using the link you saved after payment.`);
    return send(res, 200, { ok: true });
  }
  return send(res, 400, { error: "Unknown action" });
});
