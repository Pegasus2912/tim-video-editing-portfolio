const { db , wrap } = require("./_lib");
// Public site content as a script ("window.__CONTENT = {...}") loaded before app.js. Falls back to built-in defaults if empty/unavailable.
module.exports = wrap("content", async (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8"); res.setHeader("Cache-Control", "public, max-age=0, s-maxage=10, stale-while-revalidate=30");
  let out = null;
  try { if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) { const { data } = await db().from("site_content").select("key,value"); out = {}; (data || []).forEach((r) => { out[r.key] = r.value; }); } } catch { out = null; }
  res.status(200).send("window.__CONTENT=" + JSON.stringify(out).replace(/</g, "\\u003c") + ";");
});
