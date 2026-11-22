const Stripe = require("stripe"), { db, send, mail, wrap } = require("./_lib");
const raw = (req) => new Promise((ok, no) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => ok(Buffer.concat(c))); req.on("error", no); });
module.exports = wrap("stripe-webhook", async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const e = process.env;
  if (!e.STRIPE_WEBHOOK_SECRET || !e.STRIPE_SECRET_KEY || !e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY) return send(res, 503, { error: "Not configured" });
  let ev;
  try { ev = new Stripe(e.STRIPE_SECRET_KEY).webhooks.constructEvent(await raw(req), req.headers["stripe-signature"], e.STRIPE_WEBHOOK_SECRET); } catch { return send(res, 400, { error: "Invalid signature" }); }
  if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(ev.type)) await db().from("orders").update({ status: "cancelled" }).eq("stripe_session_id", ev.data.object.id).eq("status", "pending_payment");
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(ev.type)) {
    const s = ev.data.object;
    if (s.payment_status === "paid" && s.metadata && s.metadata.order_id) {
      const { data: o } = await db().from("orders").select("id,order_number,customer_email,amount_cents,status").eq("id", s.metadata.order_id).eq("stripe_session_id", s.id).maybeSingle();
      if (o && o.status === "pending_payment" && o.amount_cents === s.amount_total && s.currency === "eur") {
        const { error } = await db().from("orders").update({ status: "paid", payment_status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent: s.payment_intent }).eq("id", o.id).eq("status", "pending_payment");
        if (error) return send(res, 500, { error: "DB error" }); // Stripe retries
        await mail(o.customer_email, `Order ${o.order_number} confirmed`, `Thank you for your order ${o.order_number}! Your payment was received and I will get started. Pegasus2912`);
      }
    }
  }
  return send(res, 200, { received: true });
});
module.exports.config = { api: { bodyParser: false } };
