const $ = (s) => document.querySelector(s), app = $("#app");
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
const post = async (url, body) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { r, d: await r.json().catch(() => ({})) }; };
const input = (label, type, name) => { const w = el("label", "o-f"), i = el("input"); i.type = type; i.name = name; i.required = true; i.autocomplete = type === "password" ? "current-password" : "off"; w.append(el("span", null, label), i); return w; };
const form = (fields, btn, onSubmit, msg) => { const f = el("form", "o-form"), m = el("p", "muted", msg || ""); m.setAttribute("role", "status"); f.append(...fields, el("button", "btn", btn), m); f.addEventListener("submit", async (e) => { e.preventDefault(); m.textContent = ""; const err = await onSubmit(f); if (err) m.textContent = err; }); return f; };
const view = (...n) => { app.replaceChildren(el("p", "eyebrow", "Pegasus2912 Admin"), ...n); };
const LBL = { pending_payment: "Awaiting Payment", paid: "Paid", confirmed: "Confirmed", in_progress: "In Progress", waiting_for_customer: "Waiting for Customer Response", completed: "Completed", cancelled: "Cancelled" };

function login(msg) { view(el("h2", null, "Sign in"), form([input("Email", "email", "email"), input("Password", "password", "password")], "Continue", async (f) => {
  const { r, d } = await post("/api/admin-auth", { action: "login", email: f.elements.namedItem("email").value, password: f.elements.namedItem("password").value });
  if (!r.ok) return d.error || "Sign-in failed."; return d.stage === "mfa" ? mfa(d.factorId) : enroll(); }, msg)); }
async function enroll() { const { r, d } = await post("/api/admin-auth", { action: "enroll" }); if (!r.ok) return login(d.error || "Setup failed.");
  view(el("h2", null, "Set up two-factor authentication"), el("p", "muted", "Add this secret as a TOTP account in your authenticator app, then enter the 6-digit code:"), el("code", null, d.secret), mfaForm(d.factorId)); }
const mfaForm = (id) => form([input("6-digit code", "text", "code")], "Verify", async (f) => { const { r, d } = await post("/api/admin-auth", { action: "mfa", factorId: id, code: f.elements.namedItem("code").value.trim() }); if (!r.ok) return d.error || "Invalid code."; dash(); });
function mfa(id) { view(el("h2", null, "Two-factor code"), mfaForm(id)); }

const api = async (body) => { const { r, d } = await post("/api/admin", body); if (r.status === 401) { login("Session expired. Please sign in again."); return null; } return r.ok ? d : (alert(d.error || "Error"), null); };
let tab = "overview", search = "";
function dash() {
  const bar = el("div", "row"); ["overview", "orders", "messages", "customers", "prices", "portfolio", "content"].forEach((t) => { const b = el("button", "chip", t[0].toUpperCase() + t.slice(1)); b.type = "button"; b.setAttribute("aria-pressed", t === tab); b.addEventListener("click", () => { tab = t; dash(); }); bar.append(b); });
  const out = el("button", "btn ghost sm", "Sign out"); out.type = "button"; out.addEventListener("click", async () => { await post("/api/admin-auth", { action: "logout" }); login(); }); bar.append(out);
  const box = el("div"); view(el("h2", null, "Dashboard"), bar, box);
  ({ overview, customers, prices: pricesEd, portfolio: portfolioEd, content: contentEd }[tab] || ((b) => orders(b, tab === "messages")))(box);
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
/* ---- customers ---- */
async function customers(box) {
  const d = await api({ action: "customers" }); if (!d) return; if (!d.customers.length) box.append(el("p", "muted", "No registered customers yet."));
  d.customers.forEach((c) => { const b = el("button", "o-choice"); b.type = "button"; b.append(el("strong", null, c.name || c.email), el("span", null, c.orders + " orders"), el("small", null, `${c.email} · ${c.status} · registered ${new Date(c.created_at).toLocaleDateString()}`));
    b.addEventListener("click", async () => { const o = await api({ action: "customerOrders", id: c.id }); if (!o) return; const back = el("button", "btn ghost sm", "← Back"); back.type = "button"; back.addEventListener("click", dash); const l = el("div", "tbl");
      o.orders.forEach((x) => { const ob = el("button", "o-choice"); ob.type = "button"; ob.append(el("strong", null, `${x.order_number} · ${x.package_name}`), el("span", null, "€" + x.amount_cents / 100), el("small", null, `${LBL[x.status]} · ${x.payment_status} · ${new Date(x.created_at).toLocaleDateString()}`)); ob.addEventListener("click", () => detail(x.id)); l.append(ob); });
      view(back, el("h2", null, c.name || c.email), el("p", "muted", `${c.email} · account ${c.status}`), el("h3", null, "Order history"), l); }); box.append(b); });
}
/* ---- content editors (prices, portfolio, about, contact) ---- */
const afield = (k, l, t, o, r) => { const w = el("label", "o-f"); w.append(el("span", null, l)); let i;
  if (t === "select") { i = el("select"); o.forEach((x) => { const op = el("option", null, x); op.value = x; i.append(op); }); }
  else if (t === "lines" || t === "area") { i = el("textarea"); i.rows = t === "area" ? 9 : 4; }
  else { i = el("input"); i.type = t === "check" ? "checkbox" : t === "number" ? "number" : "text"; if (t === "number") i.step = "0.01"; }
  if (t === "check") i.checked = !!r[k]; else i.value = r[k] ?? "";
  const up = () => { r[k] = t === "check" ? i.checked : i.value; }; i.addEventListener("input", up); i.addEventListener("change", up); w.append(i); return w; };
const SAVED = "Saved. The public website updates within about 10 seconds.";
async function editor(box, key, S, blank, toUI, fromUI) {
  const g = await api({ action: "contentGet", key }); if (!g) return; const rows = g.value.map(toUI), list = el("div", "tbl");
  const draw = () => { list.replaceChildren(); rows.forEach((r, i) => { const c = el("div", "card ed"), bar = el("div", "row");
    [["↑", -1], ["↓", 1], ["Delete", 0]].forEach(([l, s]) => { const b = el("button", "btn ghost sm", l); b.type = "button"; b.addEventListener("click", () => { if (!s) { if (!confirm("Delete this entry?")) return; rows.splice(i, 1); } else { const j = i + s; if (j < 0 || j >= rows.length) return; [rows[i], rows[j]] = [rows[j], rows[i]]; } draw(); }); bar.append(b); });
    c.append(...S.map(([k, l, t, o]) => afield(k, l, t, o, r)), bar); list.append(c); }); };
  const add = el("button", "btn ghost", "+ Add"), sv = el("button", "btn", "Save changes"), r2 = el("div", "row"); add.type = sv.type = "button";
  add.addEventListener("click", () => { rows.push(blank()); draw(); }); sv.addEventListener("click", async () => { if (await api({ action: "contentSet", key, value: rows.map(fromUI) })) alert(SAVED); });
  r2.append(add, sv); box.append(list, r2); draw();
}
async function objEditor(box, key, S, toUI, fromUI) {
  const g = await api({ action: "contentGet", key }); if (!g) return; const r = toUI(g.value), f = el("div", "o-form"), sv = el("button", "btn", "Save changes"); sv.type = "button";
  sv.addEventListener("click", async () => { if (await api({ action: "contentSet", key, value: fromUI(r) })) alert(SAVED); }); f.append(...S.map(([k, l, t, o]) => afield(k, l, t, o, r)), sv); box.append(f);
}
const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
function pricesEd(box) { box.append(el("p", "muted", "Prices are charged exactly as saved here (server-side). Disable a package to hide it.")); editor(box, "packages", [["name", "Name", "text"], ["price", "Price (EUR)", "number"], ["service", "Service", "select", ["short", "long"]], ["items", "Included items (one per line)", "lines"], ["hot", "Highlight as popular", "check"], ["active", "Active (visible and orderable)", "check"], ["id", "ID (lowercase letters, digits, dashes; keep for existing packages)", "text"]],
  () => ({ id: "pkg-" + Date.now().toString(36), name: "", price: 10, service: "short", items: "", hot: false, active: true }), (p) => ({ ...p, items: p.items.join("\n") }), (p) => ({ id: p.id.trim(), service: p.service, name: p.name, price: Number(p.price), items: lines(p.items), hot: !!p.hot, active: !!p.active })); }
const parseSrc = (s) => { s = (s || "").trim(); const m = s.match(/(?:youtu\.be\/|shorts\/|[?&]v=|embed\/)([\w-]{11})/) || (/^[\w-]{11}$/.test(s) ? [0, s] : null); return m ? { youtubeId: m[1], file: "" } : /^\/?videos\//.test(s) ? { youtubeId: "", file: s } : { youtubeId: "", file: "" }; };
function portfolioEd(box) { box.append(el("p", "muted", "Order = order on the website. Source: YouTube link/ID or a file path like videos/clip.mp4 (upload the file to your repo's videos/ folder). Thumbnail: path like img/thumb.jpg or an https://i.ytimg.com/ URL. Direct file upload from this panel is not available.")); editor(box, "projects", [["title", "Title", "text"], ["cat", "Category", "select", ["Valorant", "Minecraft", "Other"]], ["type", "Format", "select", ["Short", "Video"]], ["dur", "Duration (optional, e.g. 0:45)", "text"], ["src", "Source (YouTube link/ID or videos/file.mp4)", "text"], ["thumb", "Thumbnail (optional)", "text"]],
  () => ({ title: "", cat: "Valorant", type: "Short", dur: "", src: "", thumb: "" }), (p) => ({ ...p, src: p.youtubeId || p.file }), (p) => ({ title: p.title, cat: p.cat, type: p.type, dur: p.dur || "", thumb: p.thumb || "", ...parseSrc(p.src) })); }
function contentEd(box) {
  const a = el("div"), c = el("div"); box.append(el("h3", null, "About section"), a, el("h3", null, "Contact information"), c);
  objEditor(a, "about", [["heading", "Heading", "text"], ["paragraphs", "Text (separate paragraphs with a blank line)", "area"], ["name", "Name", "text"], ["age", "Age", "text"], ["since", "Editing since", "text"], ["languages", "Languages", "text"]], (v) => ({ heading: v.heading, paragraphs: v.paragraphs.join("\n\n"), ...v.facts }), (r) => ({ heading: r.heading, paragraphs: r.paragraphs.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean), facts: { name: r.name, age: r.age, since: r.since, languages: r.languages } }));
  objEditor(c, "contact", [["email", "Email address (shown on the website)", "text"], ["discord", "Discord username", "text"], ["youtube", "YouTube URL (https://, optional)", "text"], ["tiktok", "TikTok URL (https://, optional)", "text"]], (v) => v, (r) => ({ email: r.email, discord: r.discord, youtube: r.youtube || "", tiktok: r.tiktok || "" }));
}
login();
