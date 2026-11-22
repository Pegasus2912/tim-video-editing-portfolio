const { db, limited, ip, send, originOk, mail, wrap, configProblems } = require("./_lib"), { G, setSession, clear, sessionUser } = require("./_user");
const EM = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, UUID = /^[0-9a-f-]{36}$/;
const LIST = "id,order_number,status,payment_status,package_name,amount_cents,created_at";
const FULL = LIST + ",service,video_type,video_length,game,reference_links,preferences,subtitles,notes";
const str = (v, a, b) => typeof v === "string" && v.trim().length >= a && v.length <= b;
// Translate a Supabase Auth failure into (a) a log line for the site owner and (b) a clear, safe message for the customer. Secrets/details never reach the browser.
function failure(res, ctx, r) {
  const d = r.d || {}, code = String(d.error_code || d.code || ""), msg = String(d.msg || d.message || d.error_description || d.error || ""), m = msg.toLowerCase();
  console.error(`[api:account] ${ctx} failed: http=${r.status} code=${code} msg=${msg.slice(0, 160)} ${r.err || ""}`);
  const CFG = ctx === "login" ? "Login is temporarily unavailable because of a server configuration problem. Please contact support." : "Registration is temporarily unavailable because of a server configuration problem. Please contact support.";
  if (r.status === 0) return send(res, 503, { error: "Registration is temporarily unavailable. Please try again later.", code: "AUTH_UNREACHABLE" });
  if (/invalid api key|invalid jwt|no api key|apikey/.test(m) || (r.status === 401 && !code)) return send(res, 503, { error: CFG, code: "CONFIG_ERROR" });
  if (code === "email_address_invalid") return send(res, 400, { error: "Invalid email address.", code: "EMAIL_INVALID" });
  if (code === "weak_password") return send(res, 400, { error: "Password does not meet the requirements.", code: "WEAK_PASSWORD" });
  if (["user_already_exists", "email_exists"].includes(code)) return send(res, 409, { error: "This email address is already registered. Please log in or reset your password.", code: "EMAIL_EXISTS" });
  if (code === "signup_disabled") return send(res, 403, { error: "Registration is currently disabled.", code: "SIGNUP_DISABLED" });
  if (code === "email_not_confirmed") return send(res, 403, { error: "Email verification required. Please confirm your email address first (check your inbox and spam folder).", code: "EMAIL_NOT_CONFIRMED" });
  if (code === "invalid_credentials") return send(res, 401, { error: "Incorrect email or password.", code: "BAD_CREDENTIALS" });
  if (code === "user_banned") return send(res, 403, { error: "This account is disabled.", code: "BANNED" });
  if (code === "email_address_not_authorized" || /sending (confirmation|recovery|magic)|error sending|smtp|email.*(rate|limit)/.test(m) && r.status !== 429) return send(res, 503, { error: "We could not send the verification email. Please try again later or contact support.", code: "EMAIL_SEND_FAILED" });
  if (r.status === 429 || /rate limit/.test(m)) return send(res, 429, { error: "Too many sign-up emails were requested. Please wait a few minutes and try again.", code: "RATE_LIMITED" });
  if (/database error/.test(m)) return send(res, 500, { error: "We could not create your account right now. Please try again later.", code: "PROFILE_FAILED" });
  if (r.status === 400 && ctx === "login") return send(res, 401, { error: "Incorrect email or password.", code: "BAD_CREDENTIALS" });
  return send(res, 503, { error: ctx === "login" ? "Login is temporarily unavailable. Please try again later." : "Registration is temporarily unavailable. Please try again later.", code: "AUTH_ERROR" });
}
module.exports = wrap("account", async (req, res) => {
  const e = process.env;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const cp = configProblems(); if (cp.length) { console.error("[api:account] configuration problems:", cp.join(", ")); return send(res, 503, { error: "Registration is temporarily unavailable because of a server configuration problem. Please contact support.", code: "CONFIG_ERROR" }); }
  if (!originOk(req) || !/^application\/json/.test(req.headers["content-type"] || "")) return send(res, 403, { error: "Forbidden" });
  if (limited("acc" + ip(req), 80, 600000)) return send(res, 429, { error: "Too many requests. Please try again later." });
  const b = req.body || {}, a = b.action, back = encodeURIComponent(e.SITE_URL + "/account.html");
  if (a === "signup") {
    if (limited("su" + ip(req), 5, 600000)) return send(res, 429, { error: "Too many requests. Please try again later." });
    if (!str(b.name, 2, 80)) return send(res, 400, { error: "Please enter your name (at least 2 characters).", code: "NAME_INVALID" });
    if (!str(b.email, 5, 254) || !EM.test(b.email.trim())) return send(res, 400, { error: "Invalid email address.", code: "EMAIL_INVALID" });
    if (!str(b.password, 10, 128)) return send(res, 400, { error: "Password does not meet the requirements (at least 10 characters).", code: "WEAK_PASSWORD" });
    const mailAddr = b.email.trim().toLowerCase();
    if (e.ADMIN_EMAIL && mailAddr === e.ADMIN_EMAIL.toLowerCase()) return send(res, 200, { ok: true }); // the admin address can never be registered as a customer (no hint given)
    const r = await G(`/signup?redirect_to=${back}`, { email: mailAddr, password: b.password, data: { name: b.name.trim().slice(0, 80), language: b.language === "de" ? "de" : "en" } });
    if (!r.ok) return failure(res, "signup", r);
    const u = r.d.user || r.d; // with e-mail confirmation Supabase hides an existing address by returning a user without identities
    if (Array.isArray(u.identities) && u.identities.length === 0) return process.env.HIDE_EXISTING_EMAIL === "1" ? send(res, 200, { ok: true }) : send(res, 409, { error: "This email address is already registered. Please log in or reset your password.", code: "EMAIL_EXISTS" });
    if (r.d.access_token) { setSession(res, r.d); return send(res, 200, { ok: true, loggedIn: true }); } // e-mail confirmation switched off in Supabase
    return send(res, 200, { ok: true });
  }
  if (a === "login") {
    if (limited("li" + ip(req), 8, 600000)) return send(res, 429, { error: "Too many attempts. Try again later." });
    if (!str(b.email, 3, 254) || !str(b.password, 1, 200)) return send(res, 401, { error: "Incorrect email or password.", code: "BAD_CREDENTIALS" });
    const r = await G("/token?grant_type=password", { email: b.email.trim().toLowerCase(), password: b.password });
    if (!r.ok) return failure(res, "login", r); if (!r.d.access_token) return failure(res, "login", { ...r, ok: false });
    setSession(res, r.d); return send(res, 200, { ok: true });
  }
  if (a === "resendVerification") {
    if (limited("rv" + ip(req), 3, 600000)) return send(res, 429, { error: "Too many requests. Please try again later." });
    if (str(b.email, 5, 254) && EM.test(b.email.trim())) { const r = await G(`/resend?redirect_to=${back}`, { type: "signup", email: b.email.trim().toLowerCase() }); if (!r.ok) console.error("[api:account] resend failed:", r.status, r.d.error_code || r.d.code); }
    return send(res, 200, { ok: true });
  }
  if (a === "recover") {
    if (limited("rc" + ip(req), 5, 600000)) return send(res, 429, { error: "Too many requests. Please try again later." });
    if (str(b.email, 5, 254) && EM.test(b.email.trim())) await G(`/recover?redirect_to=${back}`, { email: b.email.trim().toLowerCase() });
    return send(res, 200, { ok: true });
  }
  if (a === "resetPassword") {
    if (limited("rp" + ip(req), 8, 600000)) return send(res, 429, { error: "Too many requests. Please try again later." });
    if (!str(b.token, 20, 4096) || !str(b.password, 10, 128)) return send(res, 400, { error: "Password must have at least 10 characters." });
    const r = await G("/user", { password: b.password }, b.token, "PUT"); return r.ok ? send(res, 200, { ok: true }) : send(res, 400, { error: "This link is invalid or has expired." });
  }
  if (a === "logout") { clear(res); return send(res, 200, { ok: true }); }
  const s = await sessionUser(req, res); if (!s) return send(res, 401, { error: "Please log in." });
  const d = db(), uid = s.u.id; // every query below is filtered by uid taken from the verified session
  if (a === "me") { const { data } = await d.from("profiles").select("name,language").eq("id", uid).maybeSingle(); return send(res, 200, { user: { email: s.u.email }, profile: data || { name: "", language: "en" } }); }
  if (a === "setLanguage") { if (!["en", "de"].includes(b.language)) return send(res, 400, { error: "Invalid" }); await d.from("profiles").update({ language: b.language }).eq("id", uid); return send(res, 200, { ok: true }); }
  if (a === "deleteAccount") { // own account only (uid comes from the verified session); needs password + typed email
    if (limited("del" + uid, 3, 3600000)) return send(res, 429, { error: "Too many requests. Please try again later." });
    const em = (s.u.email || "").toLowerCase();
    if (!str(b.password, 1, 200) || typeof b.confirm !== "string" || b.confirm.trim().toLowerCase() !== em) return send(res, 400, { error: "Please confirm with your password and your email address." });
    const { data: adm } = await d.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
    if (adm || (e.ADMIN_EMAIL && em === e.ADMIN_EMAIL.toLowerCase())) return send(res, 403, { error: "This account cannot be deleted here." });
    const re = await G("/token?grant_type=password", { email: em, password: b.password }); if (!re.ok) return send(res, 401, { error: "Invalid email or password." });
    const { error: er } = await d.rpc("erase_customer", { uid }); if (er) return send(res, 500, { error: "Deletion failed. Nothing was deleted." });
    const { error: ed } = await d.auth.admin.deleteUser(uid); if (ed) return send(res, 500, { error: "Deletion failed. Please contact support." });
    clear(res); await mail(em, "Your account was deleted", "Your Pegasus2912 account and personal data were deleted. Records that must be kept by law were anonymised."); return send(res, 200, { ok: true });
  }
  if (a === "updateProfile") {
    if (!str(b.name, 2, 80) || !["en", "de"].includes(b.language)) return send(res, 400, { error: "Please check your details." });
    const { error } = await d.from("profiles").update({ name: b.name.trim(), language: b.language }).eq("id", uid); return error ? send(res, 500, { error: "Could not save." }) : send(res, 200, { ok: true });
  }
  if (a === "changePassword") { if (!str(b.password, 10, 128)) return send(res, 400, { error: "Password must have at least 10 characters." }); const r = await G("/user", { password: b.password }, s.token, "PUT"); return r.ok ? send(res, 200, { ok: true }) : send(res, 400, { error: "Could not change the password. Please log in again and retry." }); }
  if (a === "orders") {
    const { data: o } = await d.from("orders").select(LIST).eq("user_id", uid).order("created_at", { ascending: false }).limit(200);
    const ids = (o || []).map((x) => x.id), un = {};
    if (ids.length) { const { data: m } = await d.from("messages").select("order_id").in("order_id", ids).eq("sender", "admin").eq("read_by_customer", false); (m || []).forEach((x) => { un[x.order_id] = (un[x.order_id] || 0) + 1; }); }
    return send(res, 200, { orders: (o || []).map((x) => ({ ...x, unread: un[x.id] || 0 })) });
  }
  if (a === "order" || a === "send") {
    if (!UUID.test(String(b.id))) return send(res, 400, { error: "Invalid id" });
    const { data: o } = await d.from("orders").select(FULL).eq("id", b.id).eq("user_id", uid).maybeSingle();
    if (!o) return send(res, 404, { error: "Not found" }); // other customers' orders are indistinguishable from non-existent ones
    if (a === "send") {
      if (o.payment_status !== "paid") return send(res, 403, { error: "Messaging opens after payment is confirmed." });
      if (!str(b.body, 1, 2000) || !b.body.trim()) return send(res, 400, { error: "Message must be 1-2000 characters." });
      if (limited("m" + uid, 10, 600000)) return send(res, 429, { error: "Too many messages. Try again later." });
      const { error } = await d.from("messages").insert({ order_id: o.id, sender: "customer", body: b.body.trim(), read_by_customer: true }); if (error) return send(res, 500, { error: "Could not send" });
      if (e.ADMIN_EMAIL) await mail(e.ADMIN_EMAIL, `New message on ${o.order_number}`, `New customer message on order ${o.order_number}. Open the admin panel to reply.`);
    } else await d.from("messages").update({ read_by_customer: true }).eq("order_id", o.id).eq("sender", "admin").eq("read_by_customer", false);
    const { data: m } = await d.from("messages").select("id,sender,body,created_at").eq("order_id", o.id).order("created_at");
    return send(res, 200, { order: o, messages: m || [] });
  }
  return send(res, 400, { error: "Unknown action" });
});
