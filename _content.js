const { db } = require("./_lib"), DEF = require("./_defaults");
const S = (v, a, b) => (typeof v === "string" && v.trim().length >= a && v.trim().length <= b ? v.trim() : null);
const OPT = (v, b) => (v == null || v === "" ? "" : S(v, 1, b)); // optional text (German variants)
const H = (v) => { if (v === "" || v == null) return ""; try { const u = new URL(v); return u.protocol === "https:" && v.length <= 200 ? u.href : null; } catch { return null; } };
const repo = (s, dir) => s === "" || (new RegExp("^/?" + dir + "/[\\w./-]{1,100}$").test(s) && !s.includes(".."));
// files uploaded through the admin live in OUR Supabase bucket under a server-generated UUID name
const media = (s, dir, ext) => { try { const base = new URL(process.env.SUPABASE_URL).origin + "/storage/v1/object/public/media/" + dir + "/"; return s.startsWith(base) && new RegExp("^[0-9a-f-]{36}\\.(" + ext + ")$").test(s.slice(base.length)); } catch { return false; } };
const list = (v, n, b) => { if (v == null) return []; if (!Array.isArray(v) || v.length > n) return null; const o = v.map((x) => S(x, 1, b)); return o.includes(null) ? null : o; };
const V = {
  packages(v) {
    if (!Array.isArray(v) || v.length > 30) return null; const ids = new Set(), out = [];
    for (const p of v) {
      if (!p || typeof p !== "object") return null;
      const id = /^[a-z0-9-]{3,40}$/.test(p.id) ? p.id : null, name = S(p.name, 1, 60), price = Number(p.price), items = list(p.items, 12, 80), name_de = OPT(p.name_de, 60), items_de = list(p.items_de, 12, 80);
      if (!id || ids.has(id) || !["short", "long"].includes(p.service) || !name || !(price >= 0.5 && price <= 10000) || !items || name_de === null || !items_de) return null;
      ids.add(id); out.push({ id, service: p.service, name, name_de, price: Math.round(price * 100) / 100, items, items_de, hot: !!p.hot, active: p.active !== false });
    } return out;
  },
  projects(v) {
    if (!Array.isArray(v) || v.length > 60) return null; const out = [];
    for (const p of v) {
      if (!p || typeof p !== "object") return null;
      const title = S(p.title, 1, 120), title_de = OPT(p.title_de, 120), yt = p.youtubeId || "", file = p.file || "", thumb = p.thumb || "", dur = p.dur || "";
      if (!title || title_de === null || !["Valorant", "Minecraft", "Other"].includes(p.cat) || !["Short", "Video"].includes(p.type) || !/^[\d:]{0,8}$/.test(dur) || !(yt === "" || /^[\w-]{11}$/.test(yt))
        || !(repo(file, "videos") || media(file, "videos", "mp4|webm")) || !(repo(thumb, "img") || media(thumb, "thumbs", "jpg|png|webp") || /^https:\/\/i\.ytimg\.com\/[\w./-]{1,100}$/.test(thumb))) return null;
      out.push({ title, title_de, cat: p.cat, type: p.type, dur, youtubeId: yt, file, thumb });
    } return out;
  },
  about(v) {
    if (!v || typeof v !== "object" || !Array.isArray(v.paragraphs) || v.paragraphs.length < 1 || v.paragraphs.length > 6 || !v.facts) return null;
    const heading = S(v.heading, 1, 80), heading_de = OPT(v.heading_de, 80), paragraphs = list(v.paragraphs, 6, 800), paragraphs_de = list(v.paragraphs_de, 6, 800), f = v.facts, ld = OPT(f.languages_de, 60);
    const facts = { name: S(f.name, 1, 60), age: S(f.age, 1, 10), since: S(f.since, 1, 10), languages: S(f.languages, 1, 60), languages_de: ld };
    return heading && heading_de !== null && paragraphs && paragraphs_de && !Object.values(facts).includes(null) ? { heading, heading_de, paragraphs, paragraphs_de, facts } : null;
  },
  contact(v) {
    if (!v || typeof v !== "object") return null;
    const email = S(v.email, 5, 254), discord = S(v.discord, 1, 40), youtube = H(v.youtube), tiktok = H(v.tiktok);
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && discord && youtube !== null && tiktok !== null ? { email, discord, youtube, tiktok } : null;
  },
};
async function getContent(key) { const { data } = await db().from("site_content").select("value").eq("key", key).maybeSingle(); return data ? data.value : DEF[key]; }
module.exports = { V, getContent, DEF };
