const q = new URLSearchParams(location.search), $ = (s) => document.querySelector(s);
const set = (t, s, n) => { $("#t").textContent = T(t); $("#s").textContent = T(s); $("#n").textContent = n || ""; };
(async () => {
  try {
    const r = await fetch(`/api/order-status?o=${encodeURIComponent(q.get("o") || "")}&t=${encodeURIComponent(q.get("t") || "")}`);
    const d = await r.json();
    if (!r.ok) return set("Order not found", "This link is invalid or incomplete.");
    const lk = document.createElement("a"); lk.className = "btn ghost"; lk.textContent = T("Order conversation"); lk.href = "order.html?o=" + encodeURIComponent(q.get("o") || "") + "&t=" + encodeURIComponent(q.get("t") || ""); document.querySelector(".row").prepend(lk);
    const n = T("Order number:") + " " + d.order_number + " · " + T(d.package_name) + " · €" + (d.amount_cents / 100);
    if (d.payment_status === "paid") set("Thank you! Payment confirmed.", "Your order is paid and I will start working on it.", n);
    else set("Waiting for payment confirmation", "Stripe has not confirmed your payment yet. This can take a few seconds. Reload this page shortly. Your order is only marked paid after Stripe's verified confirmation.", n);
  } catch { set("Could not check the order", "Please reload or contact me by email."); }
})();
