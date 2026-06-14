/* ============================================================
   build.js — Static Site Generator untuk GitCMS (ENGINE / CORE)
   Membaca Markdown di content/, merakit DATA + SEO, lalu memanggil
   TEMA AKTIF (themes/<config.theme>/) untuk merender HTML.

   Inti tidak tahu seperti apa HTML-nya — itu urusan tema.
   Kontrak: core menyediakan data, tema memutuskan tampilannya.

   Dijalankan oleh GitHub Actions setiap ada perubahan konten.
   Jalankan lokal:  npm install && npm run build
   ============================================================ */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const util = require("./util");
const seo = require("./seo");
const { loadTheme } = require("./theme");
const { loadPlugins } = require("./plugins");
const { esc, attr, slugify } = util;

/* ---------- Path dasar ---------- */
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "_site");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const PAGES_DIR = path.join(ROOT, "content", "pages");

/* ---------- Konfigurasi situs ---------- */
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));
const U = util.makeUrlHelpers(config);

/* ---------- Setup marked (GitHub Flavored Markdown) ---------- */
marked.setOptions({ gfm: true, breaks: false, headerIds: true, mangle: false });

/* ============================================================
   Util engine (pemrosesan konten — bagian dari core)
   ============================================================ */

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePage(relPath, html) {
  // relPath seperti "posts/slug/" → tulis index.html di dalamnya
  const dir = path.join(OUT, relPath);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

function writeRaw(relFile, content) {
  const full = path.join(OUT, relFile);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, "utf8");
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    fs.readdirSync(src).forEach((item) => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readingTime(md) {
  const words = stripMarkdown(md).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function makeExcerpt(meta, body) {
  if (meta.excerpt) return meta.excerpt;
  const text = stripMarkdown(body);
  const words = text.split(/\s+/).slice(0, 32).join(" ");
  return words + (text.split(/\s+/).length > 32 ? "…" : "");
}

// YAML/gray-matter mengubah tanggal tanpa kutip (2026-06-05) menjadi objek Date.
// Normalkan kembali ke string ISO "YYYY-MM-DD" agar pengurutan & JSON-LD benar.
function normalizeDate(d) {
  if (!d) return "";
  if (d instanceof Date && !isNaN(d)) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

// Perbaiki path absolut-root pada HTML hasil render agar sesuai basePath.
// Mengubah src="/..." & href="/..." (bukan "//...") menjadi src="{basePath}/...".
function fixContentUrls(html) {
  const bp = U.basePath;
  if (!bp) return html; // situs di root domain, tidak perlu diubah
  return html.replace(/(\s(?:src|href))="\/(?!\/)/g, `$1="${bp}/`);
}

// Stub redirect (URL lama → URL bersih). Penentuan URL adalah tugas core,
// bukan tema — maka stub ini dirakit di engine.
function redirectStub(toUrl) {
  const target = U.url(toUrl);
  return `<!DOCTYPE html>
<html lang="${attr(config.language || "id")}">
<head>
  <meta charset="UTF-8">
  <title>Dialihkan…</title>
  <link rel="canonical" href="${attr(U.abs(toUrl))}">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0; url=${attr(target)}">
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p>Halaman telah dipindahkan. <a href="${attr(target)}">Klik di sini bila tidak dialihkan otomatis.</a></p>
</body>
</html>`;
}

/* ============================================================
   Baca konten
   ============================================================ */

function readMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(md|markdown)$/i.test(f))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const parsed = matter(raw);
      const meta = parsed.data || {};
      const body = parsed.content || "";

      // Normalisasi tags → array
      if (typeof meta.tags === "string") {
        meta.tags = meta.tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
      if (!Array.isArray(meta.tags)) meta.tags = meta.tags ? [meta.tags] : [];

      // Normalisasi tanggal ke string ISO (hindari objek Date dari YAML)
      meta.date = normalizeDate(meta.date);

      const slug = meta.slug || file.replace(/\.(md|markdown)$/i, "");
      const featuredImage = meta.featured_image || "";
      const ogImage = featuredImage ? U.abs(featuredImage) : (config.defaultOgImage ? U.abs(config.defaultOgImage) : "");

      return {
        file,
        slug,
        meta,
        body,
        html: fixContentUrls(marked.parse(body)),
        excerpt: makeExcerpt(meta, body),
        readingTime: readingTime(body),
        featuredImage,
        ogImage,
      };
    });
}

/* ---------- Slug yang dipakai sistem (tidak boleh dipakai post/page) ---------- */
const RESERVED_SLUGS = new Set([
  "page", "category", "tag", "admin", "theme", "public", "assets",
  "posts", "index", "404", "rss.xml", "sitemap.xml", "robots.txt",
]);

/* ---------- Baca daftar kategori terkelola (content/categories.json) ---------- */
// Struktur: [{ "name": "SEO", "slug": "seo", "description": "…" }]
// Dipakai untuk deskripsi halaman arsip kategori. Slug URL tetap memakai
// slugify(nama) agar selalu konsisten dengan tautan pada kartu artikel.
function readCategoriesConfig() {
  const file = path.join(ROOT, "content", "categories.json");
  if (!fs.existsSync(file)) return [];
  try {
    const arr = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(arr) ? arr.filter((c) => c && c.name) : [];
  } catch (e) {
    console.warn("⚠ content/categories.json tidak valid, diabaikan:", e.message);
    return [];
  }
}

/* ---------- Baca daftar widget footer (content/widgets.json) ---------- */
function readWidgetsConfig() {
  const file = path.join(ROOT, "content", "widgets.json");
  if (!fs.existsSync(file)) return [];
  try {
    const arr = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn("⚠ content/widgets.json tidak valid, diabaikan:", e.message);
    return [];
  }
}

function build() {
  const start = Date.now();

  /* ---- Muat tema aktif (themes/<config.theme>/) ---- */
  const theme = loadTheme(config, ROOT);
  console.log(`→ Tema aktif: "${theme.name}"${theme.manifest.version ? " v" + theme.manifest.version : ""}`);

  // Data KONTEN tema aktif (dari penyimpanan per-tema config.themeData) dipasang
  // ke config.profile agar template tema yang membaca `config.profile` tetap
  // bekerja tanpa perubahan. Tema baru sebaiknya membaca `ctx.themeContent`.
  // (Bila themeData belum ada, theme.content sudah berisi fallback config.profile lama.)
  config.profile = theme.content || {};

  /* ---- Muat plugin aktif (plugins/ + content/plugins.json) ---- */
  const plugins = loadPlugins(config, ROOT);
  if (plugins.activeIds.length) {
    console.log(`→ Plugin aktif: ${plugins.activeIds.join(", ")}`);
  }

  // Helper bersama yang diteruskan ke setiap template (bagian core).
  const lib = {
    esc: util.esc,
    attr: util.attr,
    slugify: util.slugify,
    formatDate: util.formatDate,
  };

  console.log("→ Membersihkan _site/…");
  fs.rmSync(OUT, { recursive: true, force: true });
  ensureDir(OUT);

  /* ---- Baca posts ---- */
  let posts = readMarkdownFiles(POSTS_DIR);

  // Hanya tampilkan yang published
  posts = posts.filter((p) => String(p.meta.status || "published").toLowerCase() !== "draft");

  // Permalink BERSIH: /{slug}/  (sebelumnya /posts/{slug}/)
  posts.forEach((p) => { p.permalink = "/" + p.slug + "/"; });

  // Urutkan terbaru dulu
  posts.sort((a, b) => String(b.meta.date || "").localeCompare(String(a.meta.date || "")));

  console.log(`→ ${posts.length} artikel published ditemukan`);

  /* ---- Baca halaman statis (lebih awal, untuk cek bentrok slug) ---- */
  let pages = readMarkdownFiles(PAGES_DIR);
  pages = pages.filter((p) => String(p.meta.status || "published").toLowerCase() !== "draft");
  pages.forEach((p) => { p.permalink = "/" + p.slug + "/"; });

  /* ---- Validasi slug: cegah bentrok antar konten & dengan path sistem ---- */
  const seenSlugs = new Map();
  const checkSlug = (slug, source) => {
    if (RESERVED_SLUGS.has(slug)) {
      console.warn(`⚠ Slug "${slug}" (${source}) bentrok dengan path sistem — ganti slug agar halaman tidak hilang.`);
    }
    if (seenSlugs.has(slug)) {
      console.warn(`⚠ Slug "${slug}" dipakai oleh ${seenSlugs.get(slug)} DAN ${source} — URL akan saling menimpa, ganti salah satu.`);
    } else {
      seenSlugs.set(slug, source);
    }
  };
  posts.forEach((p) => checkSlug(p.slug, "post:" + p.file));
  pages.forEach((p) => checkSlug(p.slug, "page:" + p.file));

  /* ---- Kumpulkan kategori & tag (dipakai arsip + widget footer) ---- */
  const catConfig = readCategoriesConfig();
  const catDescByName = {};
  catConfig.forEach((c) => { catDescByName[c.name] = c.description || ""; });

  const categories = {};
  posts.forEach((p) => {
    if (p.meta.category) {
      const key = p.meta.category;
      (categories[key] = categories[key] || []).push(p);
    }
  });

  const tags = {};
  posts.forEach((p) => {
    (p.meta.tags || []).forEach((t) => {
      (tags[t] = tags[t] || []).push(p);
    });
  });

  /* ---- Data situs bersama untuk "chrome" (header/footer/widget) ---- */
  const widgets = readWidgetsConfig();
  if (widgets.length) console.log(`→ ${widgets.length} widget footer`);
  const site = {
    widgets,
    recentPosts: posts,                  // daftar penuh; footer memotong sesuai count
    categoryNames: Object.keys(categories),
    tagNames: Object.keys(tags),
  };

  /* ---- Pabrik konteks: gabungkan dasar (core) + data khusus halaman ---- */
  function makeCtx(extra) {
    return Object.assign(
      { config, U, lib, site, themeVars: theme.vars, themeContent: theme.content, plugins },
      extra
    );
  }

  /* ---- Halaman artikel ---- */
  posts.forEach((post) => {
    // Artikel terkait: kategori sama, lalu terbaru lainnya
    const related = posts
      .filter((p) => p.slug !== post.slug)
      .sort((a, b) => {
        const sameA = a.meta.category && a.meta.category === post.meta.category ? -1 : 0;
        const sameB = b.meta.category && b.meta.category === post.meta.category ? -1 : 0;
        return sameA - sameB;
      })
      .slice(0, 3);

    const ctx = makeCtx({ post, related, seo: seo.postSeo({ config, U, post }) });
    // Beri kesempatan plugin memperkaya SEO (mis. FAQ → schema FAQPage).
    ctx.seo = plugins.filterSeo(ctx.seo, ctx);

    // URL bersih: tulis ke _site/{slug}/index.html
    writePage(post.slug + "/", theme.templates.post(ctx));

    // Redirect dari URL lama /posts/{slug}/ → /{slug}/ (jaga tautan terindeks)
    writePage("posts/" + post.slug + "/", redirectStub(post.permalink));
  });

  /* ---- Beranda + paginasi ---- */
  const perPage = config.postsPerPage || 6;
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const slice = posts.slice(i * perPage, (i + 1) * perPage);
    const ctx = makeCtx({ posts: slice, pageNum, totalPages, seo: seo.homeSeo({ config, U, pageNum }) });
    const html = theme.templates.home(ctx);
    if (pageNum === 1) {
      writePage("", html); // _site/index.html
    } else {
      writePage("page/" + pageNum + "/", html);
    }
  }

  /* ---- Arsip kategori ---- */
  Object.entries(categories).forEach(([term, list]) => {
    const description = catDescByName[term] || "";
    const ctx = makeCtx({
      kind: "category", term, posts: list, description,
      seo: seo.archiveSeo({ kind: "category", term, description, U }),
    });
    writePage("category/" + slugify(term) + "/", theme.templates.archive(ctx));
  });
  console.log(`→ ${Object.keys(categories).length} kategori`);

  /* ---- Arsip tag ---- */
  Object.entries(tags).forEach(([term, list]) => {
    const ctx = makeCtx({
      kind: "tag", term, posts: list, description: "",
      seo: seo.archiveSeo({ kind: "tag", term, description: "", U }),
    });
    writePage("tag/" + slugify(term) + "/", theme.templates.archive(ctx));
  });
  console.log(`→ ${Object.keys(tags).length} tag`);

  /* ---- Halaman statis ---- */
  pages.forEach((page) => {
    const ctx = makeCtx({ page, seo: seo.pageSeo({ config, U, page }) });
    ctx.seo = plugins.filterSeo(ctx.seo, ctx);
    writePage(page.slug + "/", theme.templates.page(ctx));
  });
  console.log(`→ ${pages.length} halaman statis`);

  /* ---- 404 ---- */
  writeRaw("404.html", theme.templates.notFound(makeCtx({ seo: seo.notFoundSeo({ U }) })));

  /* ---- sitemap.xml ---- */
  buildSitemap(posts, pages, categories, tags);

  /* ---- rss.xml ---- */
  buildRss(posts);

  /* ---- robots.txt ---- */
  writeRaw("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${U.abs("/sitemap.xml")}\n`);

  /* ---- Salin aset statis ---- */
  console.log("→ Menyalin aset (theme, admin, media)…");
  // Aset tema AKTIF disalin ke _site/theme/ → URL publik tetap /theme/style.css
  copyRecursive(theme.assetsDir, path.join(OUT, "theme"));
  copyRecursive(path.join(ROOT, "model"), path.join(OUT, "adminis168"));
  copyRecursive(path.join(ROOT, "public"), path.join(OUT, "public"));
  // .nojekyll agar GitHub Pages tidak memproses ulang dengan Jekyll
  writeRaw(".nojekyll", "");

  const secs = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n✓ Build selesai dalam ${secs}s → ${OUT}`);
}

/* ============================================================
   Sitemap & RSS  (core — tema tidak menyentuh ini)
   ============================================================ */

function buildSitemap(posts, pages, categories, tags) {
  const urls = [];
  const add = (loc, lastmod, priority) => {
    urls.push(
      `  <url>\n    <loc>${esc(loc)}</loc>` +
      (lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "") +
      `\n    <priority>${priority}</priority>\n  </url>`
    );
  };

  add(U.abs("/"), null, "1.0");
  posts.forEach((p) => add(U.abs(p.permalink), p.meta.date || null, "0.8"));
  pages.forEach((p) => add(U.abs(p.permalink), null, "0.5"));
  Object.keys(categories).forEach((c) => add(U.abs("/category/" + slugify(c) + "/"), null, "0.5"));
  Object.keys(tags).forEach((t) => add(U.abs("/tag/" + slugify(t) + "/"), null, "0.4"));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  writeRaw("sitemap.xml", xml);
}

function buildRss(posts) {
  const items = posts
    .slice(0, 20)
    .map((p) => {
      const pubDate = p.meta.date ? new Date(p.meta.date).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${esc(p.meta.title)}</title>
      <link>${esc(U.abs(p.permalink))}</link>
      <guid>${esc(U.abs(p.permalink))}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(config.title)}</title>
    <link>${esc(U.baseUrl)}/</link>
    <description>${esc(config.description)}</description>
    <language>${esc(config.language || "id")}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
  writeRaw("rss.xml", xml);
}

/* ---------- Jalankan ---------- */
try {
  build();
} catch (err) {
  console.error("\n✗ Build gagal:", err);
  process.exit(1);
}
