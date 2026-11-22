const $ = (s) => document.querySelector(s), out = $("#out"), verdict = $("#verdict");
const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
$("#where").textContent = "Checking " + location.origin;
async function probe(path, o = {}) {
  try {
    const r = await fetch(path, { cache: "no-store", headers: o.range ? { Range: "bytes=0-1" } : {} }), ct = r.headers.get("content-type") || ""; let body = null;
    if (o.json) { try { body = await r.json(); } catch {} }
    return { status: r.status, ct, body, vercel: r.headers.get("x-vercel-id") || "" };
  } catch (e) { return { status: 0, ct: "", err: e.message }; }
}
const add = (ok, title, detail) => { const b = el("div", "o-choice"); b.append(el("strong", null, (ok ? "OK    " : "FAIL  ") + title), el("small", null, detail)); b.setAttribute("data-ok", ok); out.append(b); return ok; };
(async () => {
  const tests = [
    ["Home page", "/", {}, (r) => r.status === 200 && /html/.test(r.ct)],
    ["API: /api/health (must be JSON)", "/api/health", { json: true }, (r) => r.status === 200 && r.body && Array.isArray(r.body.problems)],
    ["API: /api/content (must be JavaScript)", "/api/content", {}, (r) => r.status === 200 && /javascript/.test(r.ct)],
    ["Hero/artwork: /img/pegasus.jpg", "/img/pegasus.jpg", {}, (r) => r.status === 200 && /^image\//.test(r.ct)],
    ["Thumbnail: /img/discord-bot-ad-poster.jpg", "/img/discord-bot-ad-poster.jpg", {}, (r) => r.status === 200 && /^image\//.test(r.ct)],
    ["Video: /videos/discord-bot-ad.mp4", "/videos/discord-bot-ad.mp4", { range: true }, (r) => (r.status === 200 || r.status === 206) && /^video\/mp4/.test(r.ct)],
  ];
  const failed = [];
  for (const [title, path, o, ok] of tests) {
    const r = await probe(path, o), good = ok(r);
    add(good, title, `HTTP ${r.status || "no answer"} · ${r.ct || r.err || "-"}${r.body && r.body.problems ? " · problems: " + (r.body.problems.join(", ") || "none") : ""}${r.vercel ? " · " + r.vercel : ""}`); if (!good) failed.push(path);
  }
  if (!failed.length) { verdict.append(el("p", null, "Everything is deployed. If /api/health lists problems, fix those environment variables/settings (SETUP.md section 10).")); return; }
  // locate the files elsewhere: wrong folder level or wrong letter case
  const probes = [];
  for (const p of ["pegasus2912-site", "tim-video-editing-portfolio", "portfolio", "site", "public", "src", "dist", "Img", "IMG", "images"]) {
    const base = ["Img", "IMG", "images"].includes(p) ? `/${p}/pegasus.jpg` : `/${p}/img/pegasus.jpg`, r = await probe(base);
    if (r.status === 200 && /^image\//.test(r.ct)) probes.push([p, base]);
  }
  const root = await probe("/pegasus.jpg"); if (root.status === 200 && /^image\//.test(root.ct)) probes.push(["(repository root)", "/pegasus.jpg"]);
  if (probes.length) for (const [p, u] of probes) verdict.append(el("p", null, `FOUND the picture at ${u}. Your files are in a different place than this site expects ("${p}"). Fix: put api, img, videos, supabase, scripts directly in the repository root (next to index.html), or set Vercel > Settings > General > Root Directory to that folder, then redeploy.`));
  else verdict.append(el("p", null, "None of the failed files exist anywhere in this deployment, so they were not uploaded to GitHub or are excluded from the deployment. In Vercel open Deployments > latest deployment > Source and check whether the folders api, img and videos are listed. If not, upload them to GitHub (SETUP.md section 11a) and redeploy."));
  if (failed.includes("/api/health") && !failed.includes("/img/pegasus.jpg")) verdict.append(el("p", null, "Images work but the API does not: only the folder api is missing, or its files are not at the repository root. /api must contain health.js, account.js, _lib.js and the other 11 files."));
  verdict.append(el("p", "muted", "A redeploy is needed after every GitHub change; check that the latest deployment shows the newest commit and is Ready."));
})();
