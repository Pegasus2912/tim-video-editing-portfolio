const { db } = require("./_lib");
const cookie = (req, n) => ((req.headers.cookie || "").split(";").map((s) => s.trim().split("=")).find(([k]) => k === n) || [])[1];
const claims = (t) => { try { return JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString()); } catch { return {}; } };
// Server-side admin check: valid Supabase token + exact ADMIN_EMAIL + row in `admins` + MFA (aal2) unless needAal2 is false.
async function adminUser(req, needAal2 = true) {
  const t = cookie(req, "pg_admin"); if (!t || !process.env.ADMIN_EMAIL) return null;
  const { data, error } = await db().auth.getUser(t), u = data && data.user;
  if (error || !u || (u.email || "").toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) return null;
  if (needAal2 && claims(t).aal !== "aal2") return null;
  const { data: a } = await db().from("admins").select("user_id").eq("user_id", u.id).maybeSingle();
  return a ? { u, token: t } : null;
}
module.exports = { adminUser, cookie };
