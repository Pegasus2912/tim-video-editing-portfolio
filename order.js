const q = new URLSearchParams(location.search), $ = (s) => document.querySelector(s);
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = T(x); return n; };
const LBL = { pending_payment: "Awaiting Payment", paid: "Paid", confirmed: "Confirmed", in_progress: "In Progress", waiting_for_customer: "Waiting for Customer Response", completed: "Completed", cancelled: "Cancelled" };
const API = `/api/messages?o=${encodeURIComponent(q.get("o") || "")}&t=${encodeURIComponent(q.get("t") || "")}`;
function show(d) {
  $("#h").textContent = T("Order " + d.order.order_number); $("#meta").textContent = T(d.order.package_name) + " · " + T("status: " + (LBL[d.order.status] || d.order.status));
  const t = $("#thread"); t.replaceChildren();
  if (!d.messages.length) t.append(el("p", "muted", "No messages yet."));
  d.messages.forEach((m) => { const b = el("div", "msg " + m.sender); b.append(el("small", null, (m.sender === "admin" ? "Pegasus2912" : T("You")) + " · " + new Date(m.created_at).toLocaleString()), el("p", null, m.body)); t.append(b); });
  $("#f").hidden = d.order.payment_status !== "paid"; if ($("#f").hidden) $("#msg").textContent = T("Messaging opens after payment is confirmed.");
}
async function load() { const r = await fetch(API); if (!r.ok) { $("#h").textContent = T("Order not found"); $("#meta").textContent = T("This link is invalid."); return; } show(await r.json()); }
$("#f").addEventListener("submit", async (e) => {
  e.preventDefault(); const b = $("#body").value.trim(); if (!b) return;
  const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ o: q.get("o"), t: q.get("t"), body: b }) });
  const d = await r.json().catch(() => ({})); $("#msg").textContent = r.ok ? "" : T(d.error || "Could not send.");
  if (r.ok) { $("#body").value = ""; show(d); }
});
load(); setInterval(load, 30000);
