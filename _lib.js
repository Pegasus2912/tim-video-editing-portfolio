const crypto = require("crypto");
// Environment values pasted into Vercel often carry spaces, newlines, quotes, a trailing slash or "/rest/v1": normalise them once, centrally.
const clean = (v) => String(v == null ? "" : v).replace(/^[\s"']+|[\s"']+$/g, "");
function normalizeEnv() {
  for (const k of ["SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ADMIN_EMAIL", "RESEND_API_KEY", "MAIL_FROM"]) if (process.env[k] != null) process.env[k] = clean(process.env[k]);
  if (process.env.SUPABASE_URL != null) { const u = clean(process.env.SUPABASE_URL).replace(/\/+$/, "").replace(/\/(rest|auth)\/v1$/, ""); try { const x = new URL(u); if (/^https?:$/.test(x.protocol)) process.env.SUPABASE_URL = x.origin; } catch {} }
  if (process.env.SITE_URL != null) process.env.SITE_URL = clean(process.env.SITE_URL).replace(/\/+$/, "");
}
normalizeEnv();
const role = (k) => { try { return JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString()).role; } catch { return null; } };
// Returns machine-readable problem codes (never values). Used for logs and /api/health.
function configProblems() {
  const e = process.env, p = [], jwt = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/;
  try { const u = new URL(e.SUPABASE_URL || ""); if (!/^https?:$/.test(u.protocol)) throw 0; } catch { p.push(e.SUPABASE_URL ? "SUPABASE_URL_INVALID" : "SUPABASE_URL_MISSING"); }
  const a = e.SUPABASE_ANON_KEY, s = e.SUPABASE_SERVICE_ROLE_KEY;
  if (!a) p.push("SUPABASE_ANON_KEY_MISSING"); else if (!(jwt.test(a) && role(a) === "anon") && !/^sb_publishable_[\w-]+$/.test(a)) p.push(jwt.test(a) && role(a) === "service_role" ? "SUPABASE_ANON_KEY_IS_SERVICE_KEY" : "SUPABASE_ANON_KEY_INVALID");
  if (!s) p.push("SUPABASE_SERVICE_ROLE_KEY_MISSING"); else if (!(jwt.test(s) && role(s) === "service_role") && !/^sb_secret_[\w-]+$/.test(s)) p.push(jwt.test(s) && role(s) === "anon" ? "SUPABASE_SERVICE_ROLE_KEY_IS_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY_INVALID");
  if (a && s && a === s) p.push("SERVICE_KEY_EQUALS_ANON_KEY");
  try { if (new URL(e.SITE_URL || "").protocol !== "https:" && !/^http:\/\/localhost/.test(e.SITE_URL)) p.push("SITE_URL_NOT_HTTPS"); } catch { p.push(e.SITE_URL ? "SITE_URL_INVALID" : "SITE_URL_MISSING"); }
  return p;
}
// Every handler is wrapped: an unexpected exception becomes a JSON error (and a server log line), never an empty/HTML 500.
const wrap = (name, fn) => async (req, res) => { try { await fn(req, res); } catch (err) { console.error("[api:" + name + "] unexpected error:", err && err.message); if (!res.headersSent) { res.setHeader("Cache-Control", "no-store"); res.status(500).json({ error: "Something went wrong. Please try again later.", code: "SERVER_ERROR" }); } } };
const { createClient } = require("@supabase/supabase-js");
const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const hits = new Map(); // best-effort per-instance limiter; add Vercel WAF / Upstash for strict limits
const limited = (key, max, win) => { const n = Date.now(), a = (hits.get(key) || []).filter((t) => n - t < win); a.push(n); hits.set(key, a); return a.length > max; };
const ip = (req) => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
const send = (res, code, obj) => { res.setHeader("Cache-Control", "no-store"); res.status(code).json(obj); };
const originOk = (req) => req.headers.origin === process.env.SITE_URL; // SITE_URL: https://your-domain, no trailing slash
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
async function mail(to, subject, text) { // optional: only if RESEND_API_KEY and MAIL_FROM are set
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) return;
  try { await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }) }); } catch {}
}
module.exports = { db, limited, ip, send, originOk, sha, mail, wrap, configProblems, normalizeEnv };
