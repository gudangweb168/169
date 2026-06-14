/* ============================================================
   util.js — Util bersama (CORE)
   Dipakai oleh engine (build.js, seo.js) DAN diteruskan ke setiap
   tema lewat ctx.lib. Util ini bagian dari core, bukan tema:
   tema cukup MEMAKAI-nya, tidak mendefinisikan ulang.
   ============================================================ */

/* ---------- Escaping ---------- */
function esc(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attr(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- Slug ---------- */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------- Tanggal terformat (id/en) ---------- */
function formatDate(dateStr, lang) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const months = (lang || "id") === "id"
    ? ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* ---------- Helper URL ---------- */
// Membuat factory url() & abs() berdasarkan konfigurasi situs.
function makeUrlHelpers(config) {
  const basePath = (config.basePath || "").replace(/\/+$/, "");
  const baseUrl = (config.baseUrl || "").replace(/\/+$/, "");
  return {
    // Link internal (untuk href/src) — diawali basePath
    url: (p) => {
      const clean = "/" + String(p || "").replace(/^\/+/, "");
      return (basePath + clean).replace(/\/{2,}/g, "/").replace(":/", "://");
    },
    // URL absolut (untuk canonical/OG) — diawali baseUrl penuh
    abs: (p) => {
      const clean = "/" + String(p || "").replace(/^\/+/, "");
      return baseUrl + clean.replace(/\/{2,}/g, "/");
    },
    basePath,
    baseUrl,
  };
}

module.exports = { esc, attr, slugify, formatDate, makeUrlHelpers };
