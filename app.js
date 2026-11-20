/* ===== EDIT YOUR CONTENT HERE (everything marked REPLACE) ===== */
const PLACEHOLDER_ID = ""; // empty = project shows "Coming Soon" (no video is ever loaded)
const P = (title, cat, type, desc, dur, youtubeId = PLACEHOLDER_ID, thumb = "") => ({ title, cat, type, desc, dur, youtubeId, thumb });
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
  // ADD / REPLACE A VIDEO: edit one line. Arguments: title, game, type, description, duration, YouTube ID, optional thumbnail.
  // Example: P("My Ace Short","Valorant","Shorts","Fast cuts + captions","0:45","AbC123xyz_9")
  // With a real YouTube ID the thumbnail loads automatically. Custom thumbnail: add "img/mine.jpg" as 7th argument.
  // game: "Valorant" | "Minecraft"    type: "Shorts" | "Long-Form Videos"
  projects: [
    P("Valorant Clutch Montage (Placeholder)","Valorant","Long-Form Videos","Placeholder: replace with your best Valorant edit.","8:24"),
    P("Ranked Highlights (Placeholder)","Valorant","Long-Form Videos","Placeholder: highlights with clean pacing.","12:10"),
    P("Valorant Ace Short (Placeholder)","Valorant","Shorts","Placeholder: vertical short with animated captions.","0:42"),
    P("1v5 Clip Short (Placeholder)","Valorant","Shorts","Placeholder: hook-first short with sound effects.","0:35"),
    P("Minecraft Funny Moments (Placeholder)","Minecraft","Long-Form Videos","Placeholder: replace with your Minecraft edit.","9:05"),
    P("Minecraft Compilation (Placeholder)","Minecraft","Long-Form Videos","Placeholder: best moments compilation.","14:30"),
    P("Minecraft Speedrun Short (Placeholder)","Minecraft","Shorts","Placeholder: fast-paced short.","0:50"),
    P("Build Reveal Short (Placeholder)","Minecraft","Shorts","Placeholder: satisfying reveal edit.","0:28"),
  ],
  pricesShort: [
    {name:"Basic Short", price:5, items:["Basic cuts","Simple subtitles","Basic sound effects"]},
    {name:"Advanced Short", price:10, items:["More detailed editing","Animated captions","Sound effects","Better pacing"], hot:true},
    {name:"Premium Short", price:15, items:["Detailed editing","Advanced captions","More effects","Polished final result"]},
  ],
  pricesLong: [
    {name:"Basic Video", price:15, items:["Up to 5 minutes","Basic cuts","Simple editing"]},
    {name:"Standard Video", price:25, items:["5–10 minutes","More detailed editing","Sound effects","Background music","Better pacing"], hot:true},
    {name:"Premium Video", price:40, items:["10–20 minutes","Detailed editing","Advanced cuts","Sound effects","More polished editing"]},
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
function priceCard(p) {
  const c = el("article", "card pc" + (p.hot ? " hot" : ""));
  if (p.hot) c.append(el("span", "tag", "POPULAR"));
  c.append(el("h3", null, p.name));
  const pr = el("div", "price", "€" + p.price); pr.append(el("small", null, " starting")); c.append(pr, list(p.items), goContact());
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
const cats = ["All Projects", "Valorant", "Minecraft", "Shorts", "Long-Form Videos"], gal = $("#gallery");
let active = "All Projects";
const match = (p, c) => c === "All Projects" || p.cat === c || p.type === c;
function renderGallery() {
  gal.replaceChildren();
  const list = CONFIG.projects.filter((p) => match(p, active));
  $("#gstat").textContent = `Showing ${list.length} project${list.length === 1 ? "" : "s"}: ${active}`;
  list.forEach((p) => {
    const card = el("article", "proj"), b = el("button", "thumb");
    const ok = /^[\w-]{11}$/.test(p.youtubeId);
    b.type = "button"; b.setAttribute("aria-label", (ok ? "Play " : "Coming soon: ") + p.title);
    const src = p.thumb || (ok && p.youtubeId !== PLACEHOLDER_ID ? `https://i.ytimg.com/vi/${p.youtubeId}/hqdefault.jpg` : "");
    if (src) { const im = el("img"); im.src = src; im.alt = ""; im.loading = "lazy"; b.append(im); }
    else { b.classList.add("t-" + p.cat.toLowerCase()); b.append(el("span", "gw", p.cat), el("span", "ph", "PLACEHOLDER")); }
    b.append(el("span", "badge", p.type === "Shorts" ? "9:16 SHORT" : "LONG-FORM"));
    if (p.dur) b.append(el("span", "dur", p.dur));
    b.append(el("span", "play", "▶"), el("span", "watch", ok ? "Watch project" : "Coming soon"));
    b.addEventListener("click", () => openModal(p));
    const body = el("div", "pb"); body.append(el("span", "cat", p.cat + " · " + p.type), el("h3", null, p.title), el("p", null, p.desc));
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
  const box = $("#m-vid"), ok = /^[\w-]{11}$/.test(p.youtubeId);
  box.classList.toggle("soon", !ok);
  if (ok) {
    const f = el("iframe"); f.src = `https://www.youtube-nocookie.com/embed/${p.youtubeId}?autoplay=1&rel=0`;
    f.title = p.title; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
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
