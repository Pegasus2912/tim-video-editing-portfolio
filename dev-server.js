// npm run dev  ->  http://localhost:3000   Local test server: serves the site and runs api/*.js (similar to Vercel). Put variables from .env.example into your shell first.
const http = require("http"), fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".txt": "text/plain" };
const file = (p) => { for (const c of [p, p + ".html", path.join(p, "index.html")]) { const f = path.join(root, c); if (f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile()) return f; } return null; };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost"); let p = decodeURIComponent(u.pathname);
  if (p.startsWith("/api/")) {
    const name = p.slice(5).replace(/\.js$/, ""), fn = path.join(root, "api", name + ".js");
    if (!/^[a-z][\w-]*$/.test(name) || name.startsWith("_") || !fs.existsSync(fn)) { res.writeHead(404, { "content-type": "text/html" }); return res.end("<h1>404 NOT_FOUND: no function api/" + name + ".js</h1>"); }
    const h = require(fn); req.query = Object.fromEntries(u.searchParams);
    if (!(h.config && h.config.api && h.config.api.bodyParser === false)) { const ch = []; for await (const c of req) ch.push(c); const raw = Buffer.concat(ch).toString(); try { req.body = /json/.test(req.headers["content-type"] || "") ? JSON.parse(raw || "{}") : raw; } catch { req.body = {}; } }
    res.status = (c) => { res.statusCode = c; return res; }; res.json = (o) => { res.setHeader("content-type", "application/json; charset=utf-8"); res.end(JSON.stringify(o)); }; res.send = (s) => res.end(s);
    return h(req, res);
  }
  if (p === "/api") p = "/"; const f = file(p === "/" ? "index.html" : p.replace(/^\//, ""));
  if (!f) { res.writeHead(404, { "content-type": "text/html; charset=utf-8" }); return res.end(fs.readFileSync(path.join(root, "404.html"))); }
  res.writeHead(200, { "content-type": T[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log("http://localhost:" + (process.env.PORT || 3000)));
