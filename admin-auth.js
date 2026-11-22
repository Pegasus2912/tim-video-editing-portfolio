const { db, limited, ip, send, originOk, wrap } = require("./_lib"), { adminUser } = require("./_admin"), { G } = require("./_user");
const setC = (res, v, age) => res.setHeader("Set-Cookie", `pg_admin=${v}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${age}`);
const A = G;
const verified = (u) => (u.factors || []).filter((f) => f.factor_type === "totp" && f.status === "verified");
module.exports = wrap("admin-auth", async (req, res) => {
  const e = process.env;
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!e.SUPABASE_URL || !e.SUPABASE_ANON_KEY || !e.SUPABASE_SERVICE_ROLE_KEY || !e.ADMIN_EMAIL) return send(res, 503, { error: "Admin is not configured." });
  if (!originOk(req) || !/^application\/json/.test(req.headers["content-type"] || "")) return send(res, 403, { error: "Forbidden" });
  const b = req.body || {}, bad = () => send(res, 401, { error: "Invalid credentials" });
  if (b.action === "logout") { setC(res, "", 0); return send(res, 200, { ok: true }); }
  if (limited("auth" + ip(req), 8, 600000)) return send(res, 429, { error: "Too many attempts. Try again later." });
  if (b.action === "login") {
    if (typeof b.email !== "string" || typeof b.password !== "string" || b.password.length > 200) return bad();
    const { ok, d, status } = await A("/token?grant_type=password", { email: b.email.trim().toLowerCase(), password: b.password });
    if (!ok && (status === 0 || /invalid api key|invalid jwt|no api key/i.test(String(d.message || d.msg || "")))) { console.error("[api:admin-auth] Supabase Auth unreachable or API key rejected, http=" + status); return send(res, 503, { error: "Sign-in is temporarily unavailable because of a server configuration problem.", code: "CONFIG_ERROR" }); }
    const u = d.user;
    if (!ok || !u || (u.email || "").toLowerCase() !== e.ADMIN_EMAIL.toLowerCase()) return bad();
    const { data: a } = await db().from("admins").select("user_id").eq("user_id", u.id).maybeSingle();
    if (!a) return bad();
    setC(res, d.access_token, 3600); const f = verified(u)[0];
    return send(res, 200, f ? { stage: "mfa", factorId: f.id } : { stage: "enroll" });
  }
  const adm = await adminUser(req, false); if (!adm) return send(res, 401, { error: "Unauthorized" });
  const vf = verified(adm.u);
  if (b.action === "enroll") { // only while no verified factor exists
    if (vf.length) return send(res, 400, { error: "MFA already set up." });
    const { ok, d } = await A("/factors", { factor_type: "totp", friendly_name: "admin-" + Date.now() }, adm.token);
    return ok ? send(res, 200, { factorId: d.id, secret: d.totp.secret }) : send(res, 502, { error: "Could not start MFA setup." });
  }
  if (b.action === "mfa") {
    const own = (adm.u.factors || []).some((f) => f.id === b.factorId);
    if (!own || !/^\d{6}$/.test(String(b.code))) return send(res, 400, { error: "Invalid code" });
    const c = await A(`/factors/${b.factorId}/challenge`, {}, adm.token); if (!c.ok) return send(res, 400, { error: "Invalid code" });
    const v = await A(`/factors/${b.factorId}/verify`, { challenge_id: c.d.id, code: String(b.code) }, adm.token);
    if (!v.ok || !v.d.access_token) return send(res, 400, { error: "Invalid code" });
    setC(res, v.d.access_token, 3600); return send(res, 200, { ok: true });
  }
  return send(res, 400, { error: "Unknown action" });
});
