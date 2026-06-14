/* ============================================================
   theme.js — Pemuat tema (CORE)
   Tugas: berdasarkan config.theme, temukan folder tema aktif,
   muat template (fungsi murni (ctx) => HTML), baca manifest
   theme.json, dan RESOLVE data per-tema (opsi + konten) yang
   sudah dinamai per tema di config.themeData.

   KONTRAK: core menyediakan data, tema memutuskan tampilannya.
   Engine tidak pernah tahu seperti apa HTML-nya; ia hanya memanggil
   fungsi template milik tema aktif.

   PENYIMPANAN PER-TEMA (mirip "theme_mods" WordPress)
   ----------------------------------------------------
   Sumber kebenaran ada di config.json:

     {
       "theme": "company",
       "themeData": {
         "company": { "options": { "accent": "#2d54c8" }, "content": { ... } },
         "default":  { "options": { "accent": "#1f7a4d" }, "content": {} }
       }
     }

   Setiap tema menyimpan datanya sendiri, sehingga berganti tema TIDAK
   menimpa data tema lain. Untuk kompatibilitas mundur, bila themeData
   belum ada, core membaca field lama (config.themeOptions / config.profile)
   sebagai data tema AKTIF — situs lama tetap ter-build identik.
   ============================================================ */

const fs = require("fs");
const path = require("path");

// Template yang WAJIB disediakan setiap tema.
const REQUIRED_TEMPLATES = {
  home: "home.js",
  post: "post.js",
  page: "page.js",
  archive: "archive.js",
  notFound: "not-found.js",
};

/**
 * Muat tema aktif.
 * @returns {{ name, dir, assetsDir, templates, manifest, vars, content }}
 */
function loadTheme(config, ROOT) {
  const name = (config.theme || "default").trim();
  const dir = path.join(ROOT, "themes", name);

  if (!fs.existsSync(dir)) {
    throw new Error(
      `Tema "${name}" tidak ditemukan di themes/${name}/. ` +
      `Periksa field "theme" pada config.json, atau buat folder temanya.`
    );
  }

  const templatesDir = path.join(dir, "templates");
  const templates = {};
  for (const [key, file] of Object.entries(REQUIRED_TEMPLATES)) {
    const full = path.join(templatesDir, file);
    if (!fs.existsSync(full)) {
      throw new Error(`Tema "${name}" tidak memiliki templates/${file}. Template ini wajib ada.`);
    }
    // Muat ulang dari disk setiap build (hindari cache require basi saat dev).
    try { delete require.cache[require.resolve(full)]; } catch (_) {}
    templates[key] = require(full);
  }

  const manifest = readManifest(dir, name);

  // Resolve data tema AKTIF (opsi + konten) dari penyimpanan per-tema.
  const data = resolveThemeData(config, name);
  const vars = computeThemeVars(manifest, data.options);

  return {
    name,
    dir,
    assetsDir: path.join(dir, "assets"),
    templates,
    manifest,
    vars,
    content: data.content,
    options: data.options,
  };
}

/* ---------- Baca theme.json (manifest) ---------- */
function readManifest(dir, name) {
  const file = path.join(dir, "theme.json");
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.warn(`⚠ themes/${name}/theme.json tidak valid, diabaikan:`, e.message);
    return {};
  }
}

/* ---------- Definisi opsi tema (CSS variable) ----------
   Diambil dari manifest.customize.options bila ada (format baru),
   atau manifest.options (format lama). Mengembalikan objek
   { key: { type, default, ... } }. */
function getOptionDefs(manifest) {
  const m = manifest || {};
  if (m.customize && m.customize.options && typeof m.customize.options === "object") {
    return m.customize.options;
  }
  return (m.options && typeof m.options === "object") ? m.options : {};
}

/* ---------- Resolve data per-tema ----------
   Mengembalikan { options, content } untuk sebuah tema.
   Prioritas:
     1. config.themeData[themeName]  (sumber kebenaran baru)
     2. fallback LEGACY untuk tema AKTIF: config.themeOptions / config.profile
   Sehingga config.json lama (tanpa themeData) tetap ter-build sama. */
function resolveThemeData(config, themeName) {
  const cfg = config || {};
  const store = (cfg.themeData && typeof cfg.themeData === "object") ? cfg.themeData : null;

  if (store && store[themeName] && typeof store[themeName] === "object") {
    const slot = store[themeName];
    return {
      options: (slot.options && typeof slot.options === "object") ? slot.options : {},
      content: (slot.content && typeof slot.content === "object") ? slot.content : {},
    };
  }

  // Fallback legacy — hanya berlaku untuk tema yang sedang aktif.
  const activeName = (cfg.theme || "default").trim();
  if (themeName === activeName) {
    return {
      options: (cfg.themeOptions && typeof cfg.themeOptions === "object") ? cfg.themeOptions : {},
      content: (cfg.profile && typeof cfg.profile === "object") ? cfg.profile : {},
    };
  }

  return { options: {}, content: {} };
}

/* ---------- Hitung CSS variable dari opsi tema ----------
   Hanya menghasilkan variabel untuk opsi yang DI-OVERRIDE oleh
   pemilik situs. Bila tidak ada override, objeknya kosong sehingga
   tema memakai nilai default dari stylesheet — output situs tetap sama.

   Nama variabel = "--" + kunci opsi (mis. accent → --accent),
   sesuai pola yang dipakai di assets/style.css (var(--accent)). */
function computeThemeVars(manifest, options) {
  const defs = getOptionDefs(manifest);
  const overrides = (options && typeof options === "object") ? options : {};
  const vars = {};
  for (const key of Object.keys(defs)) {
    const def = defs[key] || {};
    const hasOverride =
      Object.prototype.hasOwnProperty.call(overrides, key) &&
      overrides[key] !== "" &&
      overrides[key] != null;
    if (hasOverride && String(overrides[key]) !== String(def.default != null ? def.default : "")) {
      vars["--" + key] = String(overrides[key]);
    }
  }
  return vars;
}

module.exports = {
  loadTheme,
  REQUIRED_TEMPLATES,
  resolveThemeData,
  computeThemeVars,
  getOptionDefs,
};
