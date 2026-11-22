const { db, limited, ip, send, sha , wrap } = require("./_lib");
module.exports = wrap("order-status", async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return send(res, 503, { error: "Not configured" });
  if (limited(ip(req), 30, 600000)) return send(res, 429, { error: "Too many requests" });
  const o = String(req.query.o || ""), t = String(req.query.t || "");
  if (!/^PG-\d{5,}$/.test(o) || !/^[a-f0-9]{48}$/.test(t)) return send(res, 400, { error: "Invalid" });
  const { data } = await db().from("orders").select("order_number,status,payment_status,package_name,amount_cents").eq("order_number", o).eq("access_token_hash", sha(t)).maybeSingle();
  return data ? send(res, 200, data) : send(res, 404, { error: "Not found" });
});
