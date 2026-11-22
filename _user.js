const { db } = require("./_lib"), { cookie } = require("./_admin");
// Calls Supabase Auth (GoTrue). The apikey header is always sent; Authorization only with a real user token (new-style publishable keys are not JWTs and must not be sent as Bearer).
const G = async (path, body, token, method = "POST") => {
  const headers = { apikey: process.env.SUPABASE_ANON_KEY, "Content-Type": "application/json" }; if (token) headers.Authorization = "Bearer " + token;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(process.env.SUPABASE_URL + "/auth/v1" + path, { method, headers, body: method === "GET" ? undefined : JSON.stringify(body || {}), signal: ctl.signal });
    const text = await r.text(); let d = {}; try { d = JSON.parse(text); } catch {}
    return { ok: r.ok, status: r.status, d: d && typeof d === "object" ? d : {} };
  } catch (e) { return { ok: false, status: 0, d: {}, err: e.message }; } finally { clearTimeout(timer); }
};
const ck = (n, v, age) => `${n}=${v}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${age}`;
const setSession = (res, d) => res.setHeader("Set-Cookie", [ck("pg_user", d.access_token, 3600), ck("pg_refresh", d.refresh_token, 2592000)]);
const clear = (res) => res.setHeader("Set-Cookie", [ck("pg_user", "", 0), ck("pg_refresh", "", 0)]);
// Identity always comes from a token verified by Supabase, never from request body or URL.
async function sessionUser(req, res) {
  const t = cookie(req, "pg_user"), rt = cookie(req, "pg_refresh");
  if (t) { const { data } = await db().auth.getUser(t); if (data && data.user) return { u: data.user, token: t }; }
  if (rt) { const r = await G("/token?grant_type=refresh_token", { refresh_token: rt }); if (r.ok && r.d.access_token) { setSession(res, r.d); return { u: r.d.user, token: r.d.access_token }; } }
  return null;
}
module.exports = { G, setSession, clear, sessionUser };
