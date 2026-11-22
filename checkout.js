const Stripe = require("stripe"), crypto = require("crypto");
const { db, limited, ip, send, originOk, sha, mail , wrap } = require("./_lib"), { getContent } = require("./_content"), { sessionUser } = require("./_user");
const S = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
const TYPES = ["Gameplay edit", "Highlights", "Montage", "Trailer", "Advertisement", "Other"], GAMES = ["Valorant", "Minecraft", "Other"], SUBS = ["No subtitles", "German", "English", "German & English"];
const okRef = (u) => { try { return u.length <= 300 && new URL(u).protocol === "https:"; } catch { return false; } };
module.exports = wrap("checkout", async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const e = process.env;
  if (!e.STRIPE_SECRET_KEY || !e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY || !e.SITE_URL) return send(res, 503, { error: "Online ordering is not configured yet." });
  if (!originOk(req) || !/^application\/json/.test(req.headers["content-type"] || "")) return send(res, 403, { error: "Forbidden" });
  if (limited(ip(req), 5, 600000)) return send(res, 429, { error: "Too many requests. Please try again later." });
  const b = req.body || {}, pk = ((await getContent("packages")) || []).find((x) => x.id === b.packageId && x.active), p = pk && { ...pk, cents: Math.round(pk.price * 100) }, refs = (typeof b.refs === "string" ? b.refs : "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (!p || !S(b.name, 2, 80) || !S(b.email, 5, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim()) || !TYPES.includes(b.videoType) || !S(b.length, 1, 40) || !GAMES.includes(b.game) || !SUBS.includes(b.subs) || !S(b.notes, 10, 4000) || (b.prefs && !S(b.prefs, 0, 1000)) || refs.length > 5 || !refs.every(okRef) || b.consent !== true)
    return send(res, 400, { error: "Please check your details and try again." });
  const sess = await sessionUser(req, res).catch(() => null), token = crypto.randomBytes(24).toString("hex");
  const { data, error } = await db().from("orders").insert({ customer_name: b.name.trim(), customer_email: b.email.trim().toLowerCase(), package_id: b.packageId, package_name: p.name, service: p.service, amount_cents: p.cents, video_type: b.videoType, video_length: b.length.trim(), game: b.game, reference_links: refs, preferences: (b.prefs || "").trim(), subtitles: b.subs, notes: b.notes.trim(), access_token_hash: sha(token), user_id: sess ? sess.u.id : null }).select("id,order_number").single();
  if (error) return send(res, 500, { error: "Could not create the order." });
  try {
    const s = await new Stripe(e.STRIPE_SECRET_KEY).checkout.sessions.create({ mode: "payment", customer_email: b.email.trim().toLowerCase(), client_reference_id: data.id, metadata: { order_id: data.id },
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: p.cents, product_data: { name: `${p.name} (${data.order_number})` } } }],
      success_url: `${e.SITE_URL}/order-success.html?o=${data.order_number}&t=${token}`, cancel_url: `${e.SITE_URL}/#pricing` });
    await db().from("orders").update({ stripe_session_id: s.id }).eq("id", data.id);
    await mail(b.email.trim(), `Order ${data.order_number} received`, `Thank you! We received your order ${data.order_number} (${p.name}). It starts once payment is confirmed. ${e.SITE_URL}/account.html`);
    return send(res, 200, { url: s.url });
  } catch { return send(res, 502, { error: "Payment provider unavailable." }); }
});
