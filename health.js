const { db, limited, ip, send, wrap, configProblems } = require("./_lib");
// Public, rate-limited configuration self-check. Returns problem CODES only (never keys, URLs or other values).
module.exports = wrap("health", async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  if (limited("hl" + ip(req), 20, 600000)) return send(res, 429, { error: "Too many requests" });
  const e = process.env, problems = configProblems(), info = {};
  if (!e.ADMIN_EMAIL) problems.push("ADMIN_EMAIL_MISSING");
  if (e.SITE_URL && req.headers.host && e.SITE_URL.replace(/^https?:\/\//, "") !== req.headers.host) problems.push("SITE_URL_DIFFERS_FROM_THIS_DOMAIN");
  const blocking = problems.some((p) => /^(SUPABASE_|SERVICE_KEY|SITE_URL_(MISSING|INVALID))/.test(p));
  if (!blocking) {
    try { // 1) is Supabase Auth reachable and does it accept the public key?
      const r = await fetch(e.SUPABASE_URL + "/auth/v1/settings", { headers: { apikey: e.SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(6000) });
      if (r.status === 401 || r.status === 403) problems.push("SUPABASE_ANON_KEY_REJECTED");
      else if (!r.ok) problems.push("SUPABASE_AUTH_ERROR_" + r.status);
      else { const s = await r.json().catch(() => ({})); info.signup_enabled = !s.disable_signup; info.email_confirmation_required = !s.mailer_autoconfirm; if (s.disable_signup) problems.push("SIGNUP_DISABLED_IN_SUPABASE"); }
    } catch { problems.push("SUPABASE_UNREACHABLE"); }
    const reachable = !problems.some((p) => /^(SUPABASE_UNREACHABLE|SUPABASE_ANON_KEY_REJECTED|SUPABASE_AUTH_ERROR)/.test(p)); // no point checking the database if Auth cannot be reached
    const chk = async (code, fn) => { try { const x = await fn(); if (x && x.error) problems.push(x.error.code === "42P01" || /does not exist|schema cache|not found/i.test(x.error.message || "") ? code : /permission|jwt|api key|invalid/i.test(x.error.message || "") ? "SUPABASE_SERVICE_ROLE_KEY_REJECTED" : code + "_ERROR"); } catch { problems.push(code + "_ERROR"); } };
    if (reachable) await chk("MIGRATION_001_MISSING", () => db().from("orders").select("id").limit(1));
    if (reachable) await chk("MIGRATION_002_MISSING", () => db().from("profiles").select("id").limit(1));
    if (reachable) await chk("MIGRATION_002_MISSING", () => db().from("site_content").select("key").limit(1));
    if (reachable) await chk("MIGRATION_003_MISSING", () => db().storage.getBucket("media"));
  }
  const list = [...new Set(problems)]; return send(res, 200, { ok: list.length === 0, problems: list, ...info });
});
