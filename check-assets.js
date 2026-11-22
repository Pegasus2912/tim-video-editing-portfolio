// Run: npm run check   (before every push): verifies that every file the site needs exists, INCLUDING the api/ folder that makes registration, login, Stripe and /api/health work.
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
const REQUIRED = ["index.html", "vercel.json", "package.json", "package-lock.json", "404.html", "account.html", "admin.html", "deploy-check.html", "deploy-check.js", "i18n.js", "app.js", "styles.css",
  ...["_lib", "_user", "_admin", "_content", "_defaults", "health", "account", "admin-auth", "admin", "checkout", "content", "messages", "order-status", "stripe-webhook"].map((n) => `api/${n}.js`)];
let bad = 0;
for (const r of REQUIRED) if (!fs.existsSync(path.join(root, r))) { console.log("MISSING (required):", r); bad++; }
try { const pk = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")); for (const d of ["stripe", "@supabase/supabase-js"]) if (!pk.dependencies || !pk.dependencies[d]) { console.log("package.json lacks dependency:", d); bad++; } } catch { console.log("package.json missing or invalid"); bad++; }
const files = fs.readdirSync(root).filter((f) => /\.(html|js|css)$/.test(f));
for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), "utf8");
  const refs = new Set([...s.matchAll(/(?:href|src)="([^"#:]+\.[a-z0-9]+)"/gi)].map((m) => m[1]), [...s.matchAll(/["'`]\/?((?:img|videos)\/[\w./-]+\.\w+)["'`]/g)].map((m) => m[1]));
  for (const r of refs) { const p = r.replace(/^\//, "").split("?")[0]; if (/^(videos\/clip)/.test(p) || /^api\//.test(p)) continue; if (!fs.existsSync(path.join(root, p))) { console.log("MISSING:", p, "(referenced in " + f + ")"); bad++; } }
}
console.log(bad ? bad + " problem(s). Fix them BEFORE pushing to GitHub." : "All required files exist (site, api/, media, config)."); process.exit(bad ? 1 : 0);
