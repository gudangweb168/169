/* ============================================================
   plugins.js — Pemuat & manajer Plugin (CORE)
   Meniru cara kerja plugin WordPress untuk GitCMS:

   • Plugin berada sebagai FOLDER mandiri di  plugins/<id>/plugin.js
     (mirip wp-content/plugins/<id>/). Setiap plugin meng-export
     manifest { id, name, description, hooks } — hooks itulah yang
     "menyambung" ke titik-titik tertentu pada proses build.

   • STATUS AKTIF disimpan terpisah di  content/plugins.json
     (mirip daftar plugin aktif di WordPress). File ini ditulis oleh
     panel admin. Plugin yang TIDAK aktif tidak dimuat sama sekali,
     sehingga output situs persis seperti tanpa plugin.

   KONTRAK: inti hanya MEMANGGIL hook; plugin yang memutuskan apa
   yang dihasilkan. Hook yang error tidak boleh menggagalkan build —
   ditangkap & dilewati dengan peringatan.

   Hook yang tersedia (semua opsional di tiap plugin):
     filterSeo(seo, ctx, self)   → kembalikan objek seo (boleh diubah)
     headExtra(ctx, self)        → string HTML untuk disuntik di <head>
     contentAfter(ctx, self)     → string HTML setelah isi artikel/halaman
     bodyEnd(ctx, self)          → string HTML sebelum </body>
   ============================================================ */

const fs = require("fs");
const path = require("path");

/* ---------- Baca status aktif (content/plugins.json) ----------
   Bentuk:
   {
     "faq": { "active": true },
     "whatsapp-overlay": { "active": true, "settings": { ... } }
   }
*/
function readState(ROOT) {
  const file = path.join(ROOT, "content", "plugins.json");
  if (!fs.existsSync(file)) return {};
  try {
    const obj = JSON.parse(fs.readFileSync(file, "utf8"));
    return obj && typeof obj === "object" ? obj : {};
  } catch (e) {
    console.warn("⚠ content/plugins.json tidak valid, diabaikan:", e.message);
    return {};
  }
}

/* ---------- Temukan manifest plugin di plugins/<id>/plugin.js ----------
   Pemindaian folder = "auto-discovery" ala WordPress. Plugin boleh ADA
   di repo tanpa aktif; keberadaannya tidak berpengaruh sampai diaktifkan. */
function discover(ROOT) {
  const dir = path.join(ROOT, "plugins");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => {
      const folder = path.join(dir, name);
      const entry = path.join(folder, "plugin.js");
      try {
        return fs.statSync(folder).isDirectory() && fs.existsSync(entry);
      } catch (_) {
        return false;
      }
    })
    .map((name) => {
      const full = path.join(dir, name, "plugin.js");
      // Muat ulang dari disk tiap build (hindari cache require basi saat dev).
      try { delete require.cache[require.resolve(full)]; } catch (_) {}
      try {
        const mod = require(full);
        if (!mod || !mod.id) {
          console.warn(`⚠ Plugin "${name}" tidak punya field "id", dilewati.`);
          return null;
        }
        return mod;
      } catch (e) {
        console.warn(`⚠ Plugin "${name}" gagal dimuat:`, e.message);
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Muat semua plugin & siapkan manajer hook.
 * @returns manajer dengan: activeIds, isActive(id), settings(id),
 *          filterSeo(seo,ctx), headExtra(ctx), contentAfter(ctx), bodyEnd(ctx)
 */
function loadPlugins(config, ROOT) {
  const state = readState(ROOT);
  const all = discover(ROOT);

  // Hanya plugin yang berstatus aktif yang dipakai.
  const active = all.filter((p) => state[p.id] && state[p.id].active === true);
  active.forEach((p) => {
    p.settings = (state[p.id] && state[p.id].settings) || {};
  });

  // Jalankan rangkaian hook bertipe FILTER (nilai mengalir & boleh diubah).
  function runFilter(hookName, value, ctx) {
    return active.reduce((acc, p) => {
      const fn = p.hooks && p.hooks[hookName];
      if (typeof fn !== "function") return acc;
      try {
        const out = fn(acc, ctx, p);
        return out === undefined ? acc : out;
      } catch (e) {
        console.warn(`⚠ Plugin "${p.id}" hook ${hookName} error:`, e.message);
        return acc;
      }
    }, value);
  }

  // Jalankan rangkaian hook bertipe HTML (digabung berurutan).
  function runConcat(hookName, ctx) {
    let html = "";
    active.forEach((p) => {
      const fn = p.hooks && p.hooks[hookName];
      if (typeof fn !== "function") return;
      try {
        const out = fn(ctx, p);
        if (out) html += out;
      } catch (e) {
        console.warn(`⚠ Plugin "${p.id}" hook ${hookName} error:`, e.message);
      }
    });
    return html;
  }

  return {
    all,
    activeIds: active.map((p) => p.id),
    isActive: (id) => active.some((p) => p.id === id),
    settings: (id) => {
      const p = active.find((x) => x.id === id);
      return p ? p.settings : {};
    },
    filterSeo: (seo, ctx) => runFilter("filterSeo", seo, ctx),
    headExtra: (ctx) => runConcat("headExtra", ctx),
    contentAfter: (ctx) => runConcat("contentAfter", ctx),
    bodyEnd: (ctx) => runConcat("bodyEnd", ctx),
  };
}

module.exports = { loadPlugins };
