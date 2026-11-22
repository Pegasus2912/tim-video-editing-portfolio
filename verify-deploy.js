// After deploying:  npm run verify -- https://your-domain.example
// 1) static assets are served; 2) EVERY api route really runs as a Vercel function (answers JSON, not the 404 page).
const base = (process.argv[2] || "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) { console.log("Usage: npm run verify -- https://your-domain.example"); process.exit(2); }
const assets = [["/img/pegasus.jpg", /^image\//, 10000], ["/img/discord-bot-ad-poster.jpg", /^image\//, 1000], ["/videos/discord-bot-ad.mp4", /^video\/mp4/, 100000], ["/favicon.ico", /./, 100]];
// [method, path, accepted statuses, body]. 503 is accepted where a missing/wrong environment variable would legitimately be reported (JSON!). A 404 is never accepted.
const api = [["GET", "/api/health", [200]], ["GET", "/api/content", [200], null, /javascript/], ["POST", "/api/account", [401, 503], { action: "me" }], ["POST", "/api/account", [400, 503], { action: "signup", name: "x", email: "bad", password: "x" }],
  ["POST", "/api/account", [401, 503], { action: "login", email: "nobody@example.invalid", password: "x" }], ["POST", "/api/admin-auth", [401, 400, 503], { action: "x" }], ["POST", "/api/admin", [401, 503], { action: "orders" }],
  ["GET", "/api/checkout", [405]], ["GET", "/api/stripe-webhook", [405]], ["GET", "/api/messages", [404, 503, 429]], ["GET", "/api/order-status", [400, 503, 429]]];
(async () => {
  let bad = 0;
  for (const [p, type, min] of assets) {
    try { const r = await fetch(base + p, { headers: { Range: "bytes=0-1023" } }), ct = r.headers.get("content-type") || "", b = Buffer.from(await r.arrayBuffer()), total = Number((r.headers.get("content-range") || "").split("/")[1] || r.headers.get("content-length") || b.length);
      let ok = (r.status === 200 || r.status === 206) && type.test(ct) && total >= min; if (p.endsWith(".mp4")) ok = ok && b.includes(Buffer.from("ftyp")); console.log(ok ? "OK     " : "FAILED ", p, r.status, ct); if (!ok) bad++; }
    catch (e) { console.log("FAILED ", p, e.message); bad++; }
  }
  let missing = 0;
  for (const [m, p, codes, body, type] of api) {
    try {
      const r = await fetch(base + p, { method: m, headers: { "Content-Type": "application/json", Origin: base }, body: body ? JSON.stringify(body) : undefined }), ct = r.headers.get("content-type") || "", text = await r.text();
      let json = null; try { json = JSON.parse(text); } catch {}
      const isFn = type ? type.test(ct) : json && typeof json === "object"; // a function answers JSON (or JS for /api/content); the 404 page is HTML
      const ok = codes.includes(r.status) && isFn && !(r.status === 404 && !json);
      if (r.status === 404 && !json) missing++;
      console.log(ok ? "OK     " : "FAILED ", m.padEnd(4), p, r.status, ct.split(";")[0], json && json.problems ? "problems=" + JSON.stringify(json.problems) : ""); if (!ok) bad++;
    } catch (e) { console.log("FAILED ", m, p, e.message); bad++; }
  }
  if (missing) console.log("\nThe api/ folder is NOT deployed (these routes returned the HTML 404 page). In GitHub the repo root must contain the folder `api` with 14 files. See SETUP.md section 11.");
  console.log(bad ? "\n" + bad + " problem(s)." : "\nAll static files are served and all API routes run as functions."); process.exit(bad ? 1 : 0);
})();
