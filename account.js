const $ = (s) => document.querySelector(s), app = $("#app");
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = T(x); return n; };
const post = async (body) => {
  let r; try { r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
  catch (e) { console.error("Network error calling /api/account:", e); return { r: { ok: false, status: 0 }, d: { error: "Network error. Please check your connection and try again.", code: "NETWORK" } }; }
  const text = await r.text(); let d = null; try { d = JSON.parse(text); } catch {}
  if (!d || typeof d !== "object") { console.error("Unexpected (non-JSON) response from /api/account: HTTP", r.status, text.slice(0, 200), "-> open /api/health to diagnose"); d = { error: r.status === 404 ? "Registration is temporarily unavailable. Please try again later." : "The server is not responding correctly. Please try again later.", code: "BAD_RESPONSE" }; }
  if (!r.ok && !d.error) d.error = "Something went wrong. Please try again later.";
  return { r, d };
};
const val = (f, n) => f.elements.namedItem(n).value;
const fld = (l, type, name, x = {}) => { const w = el("label", "o-f"), i = el("input"); i.type = type; i.name = name; i.required = true; Object.assign(i, x); w.append(el("span", null, l), i); return w; };
const form = (fields, btn, fn) => { const f = el("form", "o-form"), m = el("p", "muted"); m.setAttribute("role", "status"); f.append(...fields, el("button", "btn", btn), m); f.addEventListener("submit", async (e) => { e.preventDefault(); m.textContent = ""; const x = await fn(f); if (x) m.textContent = T(x); }); return f; };
const view = (...n) => app.replaceChildren(...n);
const LBL = { pending_payment: "Awaiting Payment", paid: "Paid", confirmed: "Confirmed", in_progress: "In Progress", waiting_for_customer: "Waiting for Customer Response", completed: "Completed", cancelled: "Cancelled" };
const consent = () => { const w = el("label", "o-c"), c = el("input"), a = el("a", null, "Privacy Policy"); c.type = "checkbox"; c.name = "consent"; c.required = true; a.href = "/legal.html#privacy"; a.target = "_blank"; a.rel = "noopener"; w.append(c, document.createTextNode(T(" I have read the ")), a, document.createTextNode(T(" and agree that my details are used to process my order."))); return w; };

function auth(msg, tab = "login") {
  const tabs = el("div", "row"); [["login", "Log in"], ["register", "Register"]].forEach(([k, l]) => { const b = el("button", "chip", l); b.type = "button"; b.setAttribute("aria-pressed", k === tab); b.addEventListener("click", () => auth("", k)); tabs.append(b); });
  const m = el("p", "muted", msg || ""); m.setAttribute("role", "status"); let f;
  if (tab === "login") {
    f = form([fld("Email address", "email", "email", { autocomplete: "email" }), fld("Password", "password", "password", { autocomplete: "current-password" })], "Log in", async (f) => {
      const { r, d } = await post({ action: "login", email: val(f, "email"), password: val(f, "password") }); if (!r.ok) { if (d.code === "EMAIL_NOT_CONFIRMED" && !f.querySelector(".resend")) { const rb = el("button", "btn ghost sm resend", "Resend verification email"); rb.type = "button"; rb.addEventListener("click", async () => { await post({ action: "resendVerification", email: val(f, "email") }); rb.textContent = T("Verification email sent (if the address is registered)."); rb.disabled = true; }); f.append(rb); } return d.error; } localStorage.setItem("pg_in", "1"); const me = await post({ action: "me" }); if (me.r.ok && me.d.profile.language && me.d.profile.language !== I18N.lang) { localStorage.setItem("lang", me.d.profile.language); location.reload(); return; } dash(); });
    const fg = el("button", "btn ghost sm", "Forgot password?"); fg.type = "button"; fg.addEventListener("click", forgot); f.append(fg);
  } else f = form([fld("Your name", "text", "name", { minLength: 2, maxLength: 80, autocomplete: "name" }), fld("Email address", "email", "email", { autocomplete: "email" }), fld("Password (min. 10 characters)", "password", "password", { minLength: 10, maxLength: 128, autocomplete: "new-password" }), consent()], "Create account", async (f) => {
    const name = val(f, "name").trim(), email = val(f, "email").trim(), password = val(f, "password");
    if (name.length < 2) return "Please enter your name (at least 2 characters)."; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address."; if (password.length < 10) return "Password does not meet the requirements (at least 10 characters).";
    const { r, d } = await post({ action: "signup", language: I18N.lang, name, email, password }); if (!r.ok) return d.error;
    if (d.loggedIn) { localStorage.setItem("pg_in", "1"); dash(); return; } auth("Check your email to verify your account."); });
  view(el("h2", null, "Pegasus2912 account"), tabs, m, f);
}
function forgot() { view(el("h2", null, "Forgot password?"), form([fld("Email address", "email", "email")], "Send reset link", async (f) => { await post({ action: "recover", email: val(f, "email") }); auth("If this email is registered, a reset link has been sent."); })); }
function reset(token) { view(el("h2", null, "Set a new password"), form([fld("New password (min. 10 characters)", "password", "password", { minLength: 10, maxLength: 128, autocomplete: "new-password" })], "Save password", async (f) => { const { r, d } = await post({ action: "resetPassword", token, password: val(f, "password") }); if (!r.ok) return d.error || "This link is invalid or has expired."; auth("Password updated. Please log in."); })); }

let tab = "orders";
async function dash() {
  const { r, d } = await post({ action: "me" }); if (!r.ok) { localStorage.removeItem("pg_in"); return auth(r.status === 401 ? "" : d.error); } localStorage.setItem("pg_in", "1");
  const bar = el("div", "row"); [["orders", "My orders"], ["settings", "Account details"]].forEach(([k, l]) => { const b = el("button", "chip", l); b.type = "button"; b.setAttribute("aria-pressed", k === tab); b.addEventListener("click", () => { tab = k; dash(); }); bar.append(b); });
  const out = el("button", "btn ghost sm", "Log out"); out.type = "button"; out.addEventListener("click", async () => { await post({ action: "logout" }); localStorage.removeItem("pg_in"); auth("You have been logged out."); }); bar.append(out);
  const mail = el("p", "muted"); mail.textContent = (d.profile.name ? d.profile.name + " · " : "") + d.user.email; const box = el("div");
  view(el("h2", null, "My account"), mail, bar, box); tab === "orders" ? orders(box) : (settings(box, d), delSection(box));
}
async function orders(box) {
  const { r, d } = await post({ action: "orders" }); if (!r.ok) return auth();
  if (!d.orders.length) { const a = el("a", "btn", "Order now"); a.href = "/#pricing"; box.append(el("p", "muted", "You have no orders yet."), a); return; }
  const l = el("div", "tbl"); d.orders.forEach((o) => { const b = el("button", "o-choice"), sm = el("small"); b.type = "button"; sm.append(el("span", null, LBL[o.status]), document.createTextNode(" · " + new Date(o.created_at).toLocaleDateString() + (o.unread ? " · " + o.unread + " " + T("new") : "")));
    b.append(el("strong", null, o.order_number + " · " + o.package_name), el("span", null, "€" + o.amount_cents / 100), sm); b.addEventListener("click", () => detail(o.id)); l.append(b); }); box.append(l);
}
async function detail(id, msg) {
  const { r, d } = await post({ action: "order", id }); if (!r.ok) return dash(); const o = d.order;
  const back = el("button", "btn ghost sm", "← Back"); back.type = "button"; back.addEventListener("click", dash);
  const dl = el("dl", "o-sum"); [["Order", o.order_number], ["Status", T(LBL[o.status])], ["Payment", T(o.payment_status)], ["Package", T(o.package_name) + " (€" + o.amount_cents / 100 + ")"], ["Video type", o.video_type], ["Length", o.video_length], ["Game", o.game], ["Subtitles", o.subtitles], ["References", (o.reference_links || []).join("\n") || "–"], ["Preferences", o.preferences || "–"], ["Instructions", o.notes]].forEach(([k, v]) => { const x = el("div"); x.append(el("dt", null, k), el("dd", null, v)); dl.append(x); });
  const th = el("div", "thread"); if (!d.messages.length) th.append(el("p", "muted", "No messages yet.")); d.messages.forEach((m) => { const b = el("div", "msg " + m.sender), s = el("small"); s.textContent = (m.sender === "admin" ? "Pegasus2912" : T("You")) + " · " + new Date(m.created_at).toLocaleString(); const p = el("p"); p.textContent = m.body; b.append(s, p); th.append(b); });
  let f; if (o.payment_status === "paid") { const ta = el("textarea"); ta.name = "body"; ta.rows = 4; ta.maxLength = 2000; ta.required = true; const w = el("label", "o-f"); w.append(el("span", null, "Message (German or English)"), ta);
    f = form([w], "Send", async (f) => { const { r, d } = await post({ action: "send", id, body: val(f, "body") }); if (!r.ok) return d.error || "Could not send."; detail(id); }); } else f = el("p", "muted", "Messaging opens after payment is confirmed.");
  view(back, el("h2", null, o.order_number), dl, el("h3", null, "Conversation"), th, f);
}
function settings(box, me) {
  const sel = el("select"); sel.name = "language"; [["en", "English"], ["de", "Deutsch"]].forEach(([v, l]) => { const op = el("option"); op.value = v; op.textContent = l; sel.append(op); }); sel.value = me.profile.language;
  const lw = el("label", "o-f"); lw.append(el("span", null, "Language"), sel);
  box.append(el("h3", null, "Account details"), form([fld("Your name", "text", "name", { value: me.profile.name, minLength: 2, maxLength: 80 }), lw], "Save", async (f) => { const { r, d } = await post({ action: "updateProfile", name: val(f, "name"), language: val(f, "language") }); if (!r.ok) return d.error || "Could not save."; localStorage.setItem("lang", val(f, "language")); return "Saved."; }),
    el("h3", null, "Change password"), form([fld("New password (min. 10 characters)", "password", "password", { minLength: 10, maxLength: 128, autocomplete: "new-password" })], "Save password", async (f) => { const { r, d } = await post({ action: "changePassword", password: val(f, "password") }); return r.ok ? "Password updated. Please log in." : d.error; }));
}
function delSection(box) {
  const f = form([fld("Your password", "password", "password", { autocomplete: "current-password" }), fld("Type your email address to confirm", "email", "confirm", { autocomplete: "off" })], "Delete my account permanently", async (f) => {
    if (!confirm(T("Really delete your account? This cannot be undone."))) return;
    const { r, d } = await post({ action: "deleteAccount", password: val(f, "password"), confirm: val(f, "confirm") }); if (!r.ok) return d.error || "Deletion failed. Nothing was deleted.";
    localStorage.removeItem("pg_in"); auth("Your account has been deleted."); });
  f.classList.add("danger"); box.append(el("h3", null, "Delete account"), el("p", "muted", "This permanently deletes your account, your messages and your personal data. Paid orders are kept only in anonymised form, as legally required. This cannot be undone."), f);
}
const lg = $("#lang"); lg.textContent = I18N.lang === "de" ? "EN" : "DE"; lg.addEventListener("click", () => I18N.set(I18N.lang === "de" ? "en" : "de"));
const h = new URLSearchParams(location.hash.slice(1)); if (location.hash) history.replaceState(null, "", location.pathname);
if (h.get("type") === "recovery" && h.get("access_token")) reset(h.get("access_token"));
else if (h.get("type") === "signup" || h.get("type") === "email_change") auth("Email verified. You can now log in.");
else if (h.get("error")) auth("This link is invalid or has expired.");
else dash();
I18N.apply(document.body);
