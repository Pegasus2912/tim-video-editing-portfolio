const { db, limited, ip, send, originOk, sha, mail , wrap } = require("./_lib");
async function find(o, t) {
  if (!/^PG-\d{5,}$/.test(o) || !/^[a-f0-9]{48}$/.test(t)) return null;
  const { data } = await db().from("orders").select("id,order_number,status,payment_status,package_name").eq("order_number", o).eq("access_token_hash", sha(t)).maybeSingle();
  return data;
}
module.exports = wrap("messages", async (req, res) => {
  const e = process.env;
  if (!e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY) return send(res, 503, { error: "Not configured" });
  if (limited("msg" + ip(req), 60, 600000)) return send(res, 429, { error: "Too many requests" });
  const post = req.method === "POST";
  if (!post && req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  if (post && (!originOk(req) || !/^application\/json/.test(req.headers["content-type"] || ""))) return send(res, 403, { error: "Forbidden" });
  const src = post ? req.body || {} : req.query, o = await find(String(src.o || ""), String(src.t || ""));
  if (!o) return send(res, 404, { error: "Not found" });
  if (post) {
    if (o.payment_status !== "paid") return send(res, 403, { error: "Messaging opens after payment is confirmed." });
    if (typeof src.body !== "string" || src.body.trim().length < 1 || src.body.length > 2000) return send(res, 400, { error: "Message must be 1-2000 characters." });
    if (limited("m" + o.id, 10, 600000)) return send(res, 429, { error: "Too many messages. Try again later." });
    const { error } = await db().from("messages").insert({ order_id: o.id, sender: "customer", body: src.body.trim(), read_by_customer: true });
    if (error) return send(res, 500, { error: "Could not send" });
    if (e.ADMIN_EMAIL) await mail(e.ADMIN_EMAIL, `New message on ${o.order_number}`, `New customer message on order ${o.order_number}. Open your admin panel to read and reply.`);
  } else await db().from("messages").update({ read_by_customer: true }).eq("order_id", o.id).eq("sender", "admin").eq("read_by_customer", false);
  const { data: m } = await db().from("messages").select("id,sender,body,created_at").eq("order_id", o.id).order("created_at");
  return send(res, 200, { order: { order_number: o.order_number, status: o.status, payment_status: o.payment_status, package_name: o.package_name }, messages: m || [] });
});
