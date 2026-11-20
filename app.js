/* ===== EDIT YOUR CONTENT HERE (everything marked REPLACE) ===== */
const PLACEHOLDER_ID = ""; // empty = project shows "Coming Soon" (no video is ever loaded)
const P = (title, cat, type, dur, src = "", thumb = "") => { const f = src.startsWith("videos/"); return { title, cat, type, dur, thumb, file: f ? src : "", youtubeId: f ? "" : src }; };
const CONFIG = {
  contact: {
    discord: "Pegasus2912",       // Discord username. Discord has no public link for usernames, so the button copies it.
    email: "Info@statelight.de",
    youtube: "",                  // OPTIONAL full https:// channel URL. Empty = button is hidden.
    tiktok: "",                   // OPTIONAL full https:// profile URL. Empty = button is hidden.
  },
  services: [
    ["Long-Form Video Editing", ["YouTube videos","Gameplay editing","Funny moments","Highlights","Clean cuts and transitions","Sound effects","Background music","Engaging pacing"]],
    ["Short-Form Content", ["YouTube Shorts","TikTok videos","Vertical 9:16 editing","Captions and subtitles","Engaging cuts","Attention-grabbing openings","Sound effects and music"]],
    ["Gaming Video Editing", ["Valorant gameplay","Minecraft gameplay","Gaming highlights","Funny moments","Compilation videos","Entertaining gaming content"]],
  ],
  // VIDEOS, shown in this order. P(title, game, type, duration, source, optionalThumbnail)
  // game: "Valorant" | "Minecraft" | "Other"   type: "Short" (vertical) | "Video" (16:9)
  // source: 11-character YouTube ID, or a local file such as "videos/clip.mp4" (then add a poster image as 6th argument).
  // Empty source = "Coming Soon". YouTube thumbnails load from i.ytimg.com unless you set your own.
  projects: [
    P("Valorant Montage Short", "Valorant", "Short", "", "7B44hmiakzg"),
    P("Valorant Montage Short", "Valorant", "Short", "", "JgmB7NDMo60"),
    P("Minecraft Server Advertisement Short", "Minecraft", "Short", "", "NKDW2TMC3wQ"),
    P("Minecraft Cheater Caught Short", "Minecraft", "Short", "", "wkA3Ethj0Mo"),
    P("Discord Bot Advertisement Short", "Other", "Short", "0:20", "videos/discord-bot-ad.mp4", "img/discord-bot-ad-poster.jpg"),
    P("Minecraft Trailer (1 Minute)", "Minecraft", "Video", "1:00", "xJP4jjOpkiQ"),
    P("Minecraft Long-Form Video", "Minecraft", "Video", "", "wGCyaZ7YLY0"),
  ],
  pricesShort: [
    {id:"short-basic",name:"Basic Short", price:5, items:["Basic cuts","Simple subtitles","Basic sound effects"]},
    {id:"short-advanced",name:"Advanced Short", price:10, items:["More detailed editing","Animated captions","Sound effects","Better pacing"], hot:true},
    {id:"short-premium",name:"Premium Short", price:15, items:["Detailed editing","Advanced captions","More effects","Polished final result"]},
  ],
  pricesLong: [
    {id:"long-basic",name:"Basic Video", price:15, items:["Up to 5 minutes","Basic cuts","Simple editing"]},
    {id:"long-standard",name:"Standard Video", price:25, items:["5–10 minutes","More detailed editing","Sound effects","Background music","Better pacing"], hot:true},
    {id:"long-premium",name:"Premium Video", price:40, items:["10–20 minutes","Detailed editing","Advanced cuts","Sound effects","More polished editing"]},
  ],
  why: [
    ["🎯","Focus on Valorant & Minecraft","I know these games, their pacing and what their audiences enjoy."],
    ["🎬","Good long-form editing","Clean cuts, sound design and pacing that holds attention."],
    ["⚡","Engaging, entertaining shorts","Hooks, captions and quick cuts built for Shorts and TikTok."],
    ["💬","Friendly communication","Clear, relaxed and respectful, from first message to delivery."],
    ["🔍","Attention to detail","I review each edit carefully before I send it."],
    ["🌱","Willing to adapt","I keep improving and happily adjust to your style and feedback."],
  ],
  steps: [
    ["✉️","Contact Me","Tell me about your project."],
    ["📁","Send Your Footage","Provide your gameplay recordings and instructions."],
    ["✂️","Editing","I edit your video according to your requirements."],
    ["📦","Delivery","Receive your finished video."],
  ],
};
/* ===== END CONFIG ===== */

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }; // textContent only: no HTML injection
const safeUrl = (u) => { try { const x = new URL(u); return x.protocol === "https:" ? x.href : "#"; } catch { return "#"; } };
const goContact = () => { const a = el("a", "btn ghost", "Contact Me"); a.href = "#contact"; return a; };

function list(items) { const ul = el("ul"); items.forEach((i) => ul.append(el("li", null, i))); return ul; }
function orderBtn(id) { const b = el("button", "btn", "Order Now"); b.type = "button"; b.addEventListener("click", () => openOrder(id)); return b; }
function priceCard(p) {
  const c = el("article", "card pc" + (p.hot ? " hot" : ""));
  if (p.hot) c.append(el("span", "tag", "POPULAR"));
  c.append(el("h3", null, p.name));
  c.append(el("div", "price", "€" + p.price), list(p.items), orderBtn(p.id));
  return c;
}
CONFIG.services.forEach(([t, i]) => { const c = el("article", "card rv"); c.append(el("h3", null, t), list(i)); $("#services-grid").append(c); });
/* Pricing toggle */
const PRICES = { short: CONFIG.pricesShort, long: CONFIG.pricesLong }, pg = $("#price-grid"), tg = $("#toggle");
pg.replaceChildren(...PRICES.short.map(priceCard));
tg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
  const m = b.dataset.m; if (tg.dataset.m === m) return;
  tg.dataset.m = m; tg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  pg.classList.add("out"); setTimeout(() => { pg.replaceChildren(...PRICES[m].map(priceCard)); pg.classList.remove("out"); }, 220);
}));
CONFIG.why.forEach(([i, t, d]) => { const c = el("article", "card rv"); c.append(el("div", "ic", i), el("h3", null, t), el("p", null, d)); $("#why-grid").append(c); });
CONFIG.steps.forEach(([i, t, d], n) => { const li = el("li", "rv"); li.append(el("div", "ic", i), el("h3", null, `${n + 1}. ${t}`), el("p", null, d)); $("#steps").append(li); });

/* Portfolio */
const cats = ["All", "Valorant", "Minecraft", "Other"], gal = $("#gallery");
let active = "All";
const match = (p, c) => c === "All" || p.cat === c;
const isYT = (id) => /^[\w-]{11}$/.test(id);
function renderGallery() {
  gal.replaceChildren();
  const list = CONFIG.projects.filter((p) => match(p, active));
  $("#gstat").textContent = `Showing ${list.length} project${list.length === 1 ? "" : "s"}: ${active}`;
  list.forEach((p) => {
    const vert = p.type === "Short", ok = !!p.file || isYT(p.youtubeId);
    const card = el("article", "proj " + (vert ? "vert" : "wide")), b = el("button", "thumb");
    b.type = "button"; b.setAttribute("aria-label", (ok ? "Play " : "Coming soon: ") + p.title);
    const src = p.thumb || (isYT(p.youtubeId) ? `https://i.ytimg.com/vi/${p.youtubeId}/hqdefault.jpg` : "");
    const fallback = () => { b.classList.add("t-" + p.cat.toLowerCase()); b.prepend(el("span", "gw", p.cat)); };
    if (src) { const im = el("img"); im.alt = ""; im.loading = "lazy"; im.addEventListener("error", () => { im.remove(); fallback(); }, { once: true }); im.src = src; b.append(im); } else fallback();
    b.append(el("span", "badge", vert ? "SHORT" : "VIDEO"));
    if (p.dur) b.append(el("span", "dur", p.dur));
    b.append(el("span", "play", "▶")); b.addEventListener("click", () => openModal(p));
    const body = el("div", "pb"); body.append(el("span", "cat", p.cat + " · " + p.type), el("h3", null, p.title));
    card.append(b, body); gal.append(card);
  });
}
cats.forEach((c) => {
  const b = el("button", "chip", c); b.type = "button"; b.setAttribute("aria-pressed", c === active);
  b.append(el("em", null, String(CONFIG.projects.filter((p) => match(p, c)).length)));
  b.addEventListener("click", () => {
    if (active === c) return; active = c;
    document.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === b));
    gal.classList.add("out"); setTimeout(() => { renderGallery(); gal.classList.remove("out"); }, 200);
  });
  $("#filters").append(b);
});
renderGallery();

/* Modal: placeholders show "Coming Soon"; real IDs load a click-to-play YouTube embed */
const modal = $("#modal"); let lastFocus;
const setInert = (on) => ["#main", "#nav", ".foot", "#top-btn"].forEach((s) => { const n = $(s); if (n) on ? n.setAttribute("inert", "") : n.removeAttribute("inert"); });
function openModal(p) {
  lastFocus = document.activeElement; $("#m-title").textContent = p.title;
  const box = $("#m-vid"), yt = isYT(p.youtubeId), vert = p.type === "Short";
  box.classList.toggle("soon", !yt && !p.file); box.classList.toggle("v", vert); $(".m-box").classList.toggle("v", vert);
  if (p.file) { const v = el("video"); v.src = p.file; v.controls = true; v.autoplay = true; v.playsInline = true; if (p.thumb) v.poster = p.thumb; v.setAttribute("controlslist", "nodownload"); box.replaceChildren(v); }
  else if (yt) {
    const f = el("iframe"); f.src = `https://www.youtube-nocookie.com/embed/${p.youtubeId}?autoplay=1&rel=0`;
    f.title = p.title; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
    box.replaceChildren(f);
  } else { const d = el("div", "soon-in"); d.append(el("p", "soon-t", "Coming Soon"), el("p", null, "This project video will be added soon.")); box.replaceChildren(d); }
  setInert(true); document.body.classList.add("lock"); modal.hidden = false; $("#m-x").focus();
}
function closeModal() { modal.hidden = true; $("#m-vid").replaceChildren(); setInert(false); document.body.classList.remove("lock"); if (lastFocus) lastFocus.focus(); }
$("#m-x").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => {
  if (modal.hidden) return;
  if (e.key === "Escape") return closeModal();
  if (e.key === "Tab") { const f = [...modal.querySelectorAll("button,iframe")], i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
});

/* Contact */
const C = CONFIG.contact, row = $("#contact-row");
const link = (label, href, ghost) => { const a = el("a", "btn" + (ghost ? " ghost" : ""), label); a.href = href; if (href.startsWith("https")) { a.target = "_blank"; a.rel = "noopener noreferrer"; } return a; };
const mail = "mailto:" + encodeURIComponent(C.email).replace("%40", "@");
const dc = el("button", "btn", "Discord"); dc.type = "button"; dc.setAttribute("aria-describedby", "toast");
dc.addEventListener("click", async () => { let m = "Discord username: " + C.discord; try { await navigator.clipboard.writeText(C.discord); m += " (copied to clipboard)"; } catch {} $("#toast").textContent = m; });
const socials = [["YouTube", C.youtube], ["TikTok", C.tiktok]].map(([t, u]) => [t, u ? safeUrl(u) : "#"]).filter(([, u]) => u !== "#");
row.append(dc, link("Email", mail, true), ...socials.map(([t, u]) => link(t, u, true)));
$("#c-mail").href = mail; $("#c-mail").textContent = C.email; $("#c-dc").textContent = C.discord;

/* UI behaviour */
$("#yr").textContent = new Date().getFullYear();
const nav = $("#nav"), topBtn = $("#top-btn"), menu = $("#menu"), burger = $("#burger");
addEventListener("scroll", () => { nav.classList.toggle("s", scrollY > 30); topBtn.classList.toggle("on", scrollY > 600); }, { passive: true });
topBtn.addEventListener("click", () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
burger.addEventListener("click", () => { const o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
menu.addEventListener("click", (e) => { if (e.target.closest("a")) { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); } });
/* Scroll animations */
document.querySelectorAll("section:not(.hero) :is(h2,.eyebrow,.sub,.note,.filters,.toggle)").forEach((n) => n.classList.add("rv"));
$(".about > div:first-child").classList.add("rv", "l"); $(".about .txt").classList.add("rv", "r"); $(".glass.center").classList.add("rv", "z");
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; const n = e.target; n.classList.add("in"); io.unobserve(n);
  setTimeout(() => { n.classList.remove("rv", "in", "l", "r", "z", "reveal"); n.style.transitionDelay = ""; }, 1600); // frees hover transitions afterwards
}), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll(".reveal,.rv").forEach((n) => { n.style.transitionDelay = Math.min([...n.parentNode.children].indexOf(n), 5) * 90 + "ms"; io.observe(n); });
const so = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("seen")), { threshold: 0.1 });
document.querySelectorAll(".sec").forEach((s) => so.observe(s));

/* Active nav link, scroll progress, cursor glow */
const links = [...menu.querySelectorAll("a:not(.btn)")];
const ao = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => { const on = a.hash === "#" + e.target.id; a.classList.toggle("act", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }); }), { rootMargin: "-45% 0px -50% 0px" });
["about", "services", "work", "pricing", "why", "process", "contact"].forEach((id) => ao.observe($("#" + id)));
const root = document.documentElement;
addEventListener("scroll", () => root.style.setProperty("--sp", scrollY / Math.max(1, root.scrollHeight - innerHeight)), { passive: true });
addEventListener("pointermove", (e) => { root.style.setProperty("--gx", e.clientX + "px"); root.style.setProperty("--gy", e.clientY + "px"); }, { passive: true });

/* Footer links */
[["Discord", "#contact"], ["Email", mail], ["YouTube", C.youtube && safeUrl(C.youtube)], ["TikTok", C.tiktok && safeUrl(C.tiktok)]].filter(([, h]) => h && h !== "#").forEach(([t, h]) => {
  const li = el("li"), a = el("a", null, t); a.href = h; if (h.startsWith("https")) { a.target = "_blank"; a.rel = "noopener noreferrer"; } li.append(a); $("#f-con").append(li);
});

/* Hero particles (skipped for reduced motion; paused off-screen) */
(function () {
  const c = $("#fx"); if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const x = c.getContext("2d"); if (!x) return; let w, h, ps = [], run = true;
  const init = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight;
    ps = Array.from({ length: w < 700 ? 28 : 60 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.35 + 0.08, d: Math.random() * 2 - 1, c: Math.random() < 0.5 ? "139,92,246" : "59,130,246", a: Math.random() * 0.6 + 0.2 })); };
  init(); addEventListener("resize", init);
  new IntersectionObserver((e) => { run = e[0].isIntersecting; }).observe(c);
  (function f(t) {
    if (run) { x.clearRect(0, 0, w, h);
      for (const p of ps) { p.y -= p.v; p.x += Math.sin(t / 2000 + p.d * 6) * 0.25; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        x.beginPath(); x.fillStyle = `rgba(${p.c},${p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.d * 9))})`; x.arc(p.x, p.y, p.r, 0, 6.3); x.fill(); } }
    requestAnimationFrame(f);
  })(0);
})();

/* Escape closes the mobile menu and returns focus to the burger */
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.focus(); } });

/* ===== Order wizard: service -> package -> project details -> review & pay (Stripe Checkout) ===== */
const ALLPK = [...CONFIG.pricesShort.map((p) => ({ ...p, service: "short" })), ...CONFIG.pricesLong.map((p) => ({ ...p, service: "long" }))];
const SVC = { short: "Short-Form Editing", long: "Long-Form Editing" };
const FIELDS = [["name", "Your name", "text", 1, 80], ["email", "Email address", "email", 1, 254], ["videoType", "Video type", "select", ["Gameplay edit", "Highlights", "Montage", "Trailer", "Advertisement", "Other"]], ["length", "Desired video length (e.g. 45 seconds)", "text", 1, 40], ["game", "Game", "select", ["Valorant", "Minecraft", "Other"]], ["refs", "Reference videos or links (https only, one per line, optional)", "textarea", 0, 1000], ["prefs", "Editing preferences (style, music, pacing; optional)", "textarea", 0, 1000], ["subs", "Subtitles / language", "select", ["No subtitles", "German", "English", "German & English"]], ["notes", "Describe exactly what you want (German or English)", "textarea big", 1, 4000]];
const ow = el("div", "modal order"); ow.hidden = true; ow.setAttribute("role", "dialog"); ow.setAttribute("aria-modal", "true"); ow.setAttribute("aria-labelledby", "o-title");
const ob = el("div", "o-box"); ow.append(ob); document.body.append(ow);
let ord = {}, step = 1, oLast;
const pk = () => ALLPK.find((p) => p.id === ord.packageId);
const back = (s) => { const b = el("button", "btn ghost", "← Back"); b.type = "button"; b.addEventListener("click", () => { step = s; draw(); }); return b; };
function openOrder(id) { oLast = document.activeElement; ord = id ? { packageId: id, service: id.split("-")[0] } : {}; step = id ? 3 : 1; setInert(true); document.body.classList.add("lock"); ow.hidden = false; draw(); }
function closeOrder() { ow.hidden = true; setInert(false); document.body.classList.remove("lock"); if (oLast) oLast.focus(); }
function draw() {
  ob.replaceChildren(); ob.scrollTop = 0;
  const top = el("div", "o-top"), x = el("button", "m-x o-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Close order"); x.addEventListener("click", closeOrder);
  top.append(el("span", "muted", `Step ${step} of 4`), x);
  const t = el("h2", null, ["", "Choose a service", "Choose a package", "Your project", "Review & pay"][step]); t.id = "o-title"; t.tabIndex = -1; ob.append(top, t);
  if (step === 1) { const g = el("div", "o-choices"); Object.entries(SVC).forEach(([k, v]) => { const b = el("button", "o-choice", v); b.type = "button"; b.addEventListener("click", () => { ord.service = k; step = 2; draw(); }); g.append(b); }); ob.append(g); }
  if (step === 2) { const g = el("div", "o-choices"); ALLPK.filter((p) => p.service === ord.service).forEach((p) => { const b = el("button", "o-choice"); b.type = "button"; b.append(el("strong", null, p.name), el("span", null, "€" + p.price), el("small", null, p.items.join(" · "))); b.addEventListener("click", () => { ord.packageId = p.id; step = 3; draw(); }); g.append(b); }); ob.append(g, back(1)); }
  if (step === 3) {
    const f = el("form", "o-form"); f.append(el("p", "o-pk", `${SVC[pk().service]} · ${pk().name} · €${pk().price}`));
    FIELDS.forEach(([n, l, k, a, b]) => {
      const w = el("label", "o-f"); w.append(el("span", null, l)); let i;
      if (k === "select") { i = el("select"); a.forEach((o) => { const op = el("option", null, o); op.value = o; i.append(op); }); }
      else { i = k.startsWith("textarea") ? el("textarea", k.includes("big") ? "big" : "") : el("input"); if (i.tagName === "INPUT") i.type = k; else i.rows = k.includes("big") ? 8 : 3; i.maxLength = b; i.required = !!a; i.minLength = n === "notes" ? 10 : n === "name" ? 2 : 0; }
      i.name = n; if (ord[n]) i.value = ord[n]; w.append(i); f.append(w);
    });
    const cw = el("label", "o-c"), cb = el("input"); cb.type = "checkbox"; cb.name = "consent"; cb.required = true; cb.checked = !!ord.consent;
    const pl = el("a", null, "Privacy Policy"); pl.href = "legal.html#privacy"; pl.target = "_blank"; pl.rel = "noopener";
    cw.append(cb, document.createTextNode(" I have read the "), pl, document.createTextNode(" and agree that my details are used to process my order."));
    const nx = el("button", "btn", "Review order →"); nx.type = "submit"; const row = el("div", "row"); row.append(back(2), nx); f.append(cw, row);
    f.addEventListener("submit", (e) => { e.preventDefault(); FIELDS.forEach(([n]) => { ord[n] = f.elements.namedItem(n).value.trim(); }); ord.consent = cb.checked; step = 4; draw(); });
    ob.append(f);
  }
  if (step === 4) {
    const p = pk(), l = el("dl", "o-sum");
    [["Service", SVC[p.service]], ["Package", p.name], ["Name", ord.name], ["Email", ord.email], ["Video type", ord.videoType], ["Length", ord.length], ["Game", ord.game], ["Subtitles", ord.subs], ["References", ord.refs || "–"], ["Preferences", ord.prefs || "–"], ["Instructions", ord.notes]].forEach(([k, v]) => { const d = el("div"); d.append(el("dt", null, k), el("dd", null, v)); l.append(d); });
    const msg = el("p", "muted"); msg.setAttribute("role", "status");
    const pay = el("button", "btn", "Pay securely with Stripe"); pay.type = "button"; pay.addEventListener("click", () => checkout(pay, msg));
    const row = el("div", "row"); row.append(back(3), pay);
    ob.append(l, el("p", "o-tot", "Total: €" + p.price), row, msg, el("p", "muted small", "Payment is handled by Stripe. Card details never reach this website."));
  }
  t.focus();
}
async function checkout(btn, msg) {
  btn.disabled = true; msg.textContent = "Connecting to secure checkout…";
  const body = {}; ["packageId", "name", "email", "videoType", "length", "game", "refs", "prefs", "subs", "notes", "consent"].forEach((k) => { body[k] = ord[k]; });
  try {
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && typeof d.url === "string" && d.url.startsWith("https://checkout.stripe.com/")) { location.assign(d.url); return; }
    msg.textContent = d.error || "Online ordering is not available right now. Please contact me by email.";
  } catch { msg.textContent = "Online ordering is not available right now. Please contact me by email."; }
  btn.disabled = false;
}
document.addEventListener("keydown", (e) => {
  if (ow.hidden) return;
  if (e.key === "Escape") return closeOrder();
  if (e.key === "Tab") { const f = [...ow.querySelectorAll("button,input,select,textarea,a[href]")].filter((n) => !n.disabled), i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
});
