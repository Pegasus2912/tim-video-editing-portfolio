const $ = (s) => document.querySelector(s), app = $("#app");
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
const post = async (url, body) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { r, d: await r.json().catch(() => ({})) }; };
const input = (label, type, name) => { const w = el("label", "o-f"), i = el("input"); i.type = type; i.name = name; i.required = true; i.autocomplete = type === "password" ? "current-password" : "off"; w.append(el("span", null, label), i); return w; };
const form = (fields, btn, onSubmit, msg) => { const f = el("form", "o-form"), m = el("p", "muted", msg || ""); m.setAttribute("role", "status"); f.append(...fields, el("button", "btn", btn), m); f.addEventListener("submit", async (e) => { e.preventDefault(); m.textContent = ""; const err = await onSubmit(f); if (err) m.textContent = err; }); return f; };
const view = (...n) => { app.replaceChildren(el("p", "eyebrow", "Pegasus2912 Admin"), ...n); };
const LBL = { pending_payment: "Pending Payment", paid: "Paid", in_progress: "In Progress", waiting_for_customer: "Waiting for Customer", completed: "Completed", cancelled: "Cancelled" };

function login(msg) { view(el("h2", null, "Sign in"), form([input("Email", "email", "email"), input("Password", "password", "password")], "Continue", async (f) => {
  const { r, d } = await post("/api/admin-auth", { action: "login", email: f.email.value, password: f.password.value });
  if (!r.ok) return d.error || "Sign-in failed."; return d.stage === "mfa" ? mfa(d.factorId) : enroll(); }, msg)); }
async function enroll() { const { r, d } = await post("/api/admin-auth", { action: "enroll" }); if (!r.ok) return login(d.error || "Setup failed.");
  view(el("h2", null, "Set up two-factor authentication"), el("p", "muted", "Add this secret as a TOTP account in your authenticator app, then enter the 6-digit code:"), el("code", null, d.secret), mfaForm(d.factorId)); }
const mfaForm = (id) => form([input("6-digit code", "text", "code")], "Verify", async (f) => { const { r, d } = await post("/api/admin-auth", { action: "mfa", factorId: id, code: f.code.value.trim() }); if (!r.ok) return d.error || "Invalid code."; dash(); });
function mfa(id) { view(el("h2", null, "Two-factor code"), mfaForm(id)); }

const api = async (body) => { const { r, d } = await post("/api/admin", body); if (r.status === 401) { login("Session expired. Please sign in again."); return null; } return r.ok ? d : (alert(d.error || "Error"), null); };
let tab = "overview", search = "";
function dash() {
  const bar = el("div", "row"); ["overview", "orders", "messages"].forEach((t) => { const b = el("button", "chip", t[0].toUpperCase() + t.slice(1)); b.type = "button"; b.setAttribute("aria-pressed", t === tab); b.addEventListener("click", () => { tab = t; dash(); }); bar.append(b); });
  const out = el("button", "btn ghost sm", "Sign out"); out.type = "button"; out.addEventListener("click", async () => { await post("/api/admin-auth", { action: "logout" }); login(); }); bar.append(out);
  const box = el("div"); view(el("h2", null, "Dashboard"), bar, box);
  tab === "overview" ? overview(box) : orders(box, tab === "messages");
}
async function overview(box) { const d = await api({ action: "overview" }); if (!d) return; const g = el("div", "cards3");
  [["Total orders", d.total], ["Pending payment", d.counts.pending_payment || 0], ["Paid", d.counts.paid || 0], ["In progress", d.counts.in_progress || 0], ["Completed", d.counts.completed || 0], ["Unread messages", d.unread]].forEach(([k, v]) => { const c = el("div", "card"); c.append(el("small", "muted", k), el("div", "price", String(v))); g.append(c); });
  const l = el("ul", "list"); d.recent.forEach((o) => l.append(el("li", null, `${o.order_number} · ${o.customer_name} · ${LBL[o.status]} · ${new Date(o.created_at).toLocaleString()}`))); box.append(g, el("h3", null, "Recent activity"), l); }
async function orders(box, onlyUnread) { const d = await api({ action: "orders" }); if (!d) return;
  const s = el("input"); s.type = "search"; s.placeholder = "Search customer name or email"; s.value = search; s.setAttribute("aria-label", "Search customers"); const t = el("div", "tbl"); box.append(s, t);
  const draw = () => { search = s.value.toLowerCase(); t.replaceChildren(); d.orders.filter((o) => (!onlyUnread || o.unread) && (o.customer_name + o.customer_email).toLowerCase().includes(search)).forEach((o) => { const b = el("button", "o-choice"); b.type = "button"; b.append(el("strong", null, `${o.order_number} · ${o.customer_name}`), el("span", null, `€${o.amount_cents / 100}`), el("small", null, `${o.customer_email} · ${o.package_name} · ${LBL[o.status]} · ${o.payment_status}${o.unread ? " · " + o.unread + " unread" : ""}`)); b.addEventListener("click", () => detail(o.id)); t.append(b); }); };
  s.addEventListener("input", draw); draw(); }
async function detail(id) { const d = await api({ action: "order", id }); if (!d) return; const o = d.order;
  const back = el("button", "btn ghost sm", "← Back"); back.type = "button"; back.addEventListener("click", dash);
  const dl = el("dl", "o-sum"); [["Order", o.order_number], ["Customer", `${o.customer_name} <${o.customer_email}>`], ["Package", `${o.package_name} (€${o.amount_cents / 100})`], ["Payment", o.payment_status], ["Ordered", new Date(o.created_at).toLocaleString()], ["Video type", o.video_type], ["Length", o.video_length], ["Game", o.game], ["Subtitles", o.subtitles], ["Preferences", o.preferences || "–"], ["Instructions", o.notes]].forEach(([k, v]) => { const r = el("div"); r.append(el("dt", null, k), el("dd", null, v)); dl.append(r); });
  const refs = el("dd"); (o.reference_links || []).forEach((u) => { if (u.startsWith("https://")) { const a = el("a", null, u); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer nofollow"; refs.append(a, el("br")); } }); if (!refs.childNodes.length) refs.textContent = "–"; const rr = el("div"); rr.append(el("dt", null, "References"), refs); dl.append(rr);
  const sel = el("select"); Object.entries(LBL).forEach(([k, v]) => { const op = el("option", null, v); op.value = k; sel.append(op); }); sel.value = o.status;
  const sv = el("button", "btn sm", "Save status"); sv.type = "button"; sv.addEventListener("click", async () => { if (await api({ action: "setStatus", id, status: sel.value })) detail(id); });
  const th = el("div", "thread"); d.messages.forEach((m) => { const b = el("div", "msg " + m.sender); b.append(el("small", null, (m.sender === "admin" ? "You" : o.customer_name) + " · " + new Date(m.created_at).toLocaleString()), el("p", null, m.body)); th.append(b); });
  const ta = el("textarea"); ta.rows = 4; ta.maxLength = 4000; ta.required = true; ta.setAttribute("aria-label", "Reply");
  const rf = el("form", "o-form"); rf.append(ta, el("button", "btn", "Send reply")); rf.addEventListener("submit", async (e) => { e.preventDefault(); if (ta.value.trim() && await api({ action: "reply", id, body: ta.value })) detail(id); });
  const sr = el("div", "row"); sr.append(sel, sv); view(back, el("h2", null, o.order_number), dl, sr, el("h3", null, "Conversation"), th, rf); }
login();
