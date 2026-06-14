/* ============================================================
   partials/layout.js — Kerangka halaman (TEMA)
   Menyatukan head + header + main + footer + skrip tema.
   Dipanggil oleh setiap template: layout(ctx, contentHtml).
   ============================================================ */

const head = require("./head");
const header = require("./header");
const footer = require("./footer");

module.exports = function layout(ctx, content) {
  const { config, U, lib } = ctx;
  const { attr } = lib;

  return `<!DOCTYPE html>
<html lang="${attr(config.language || "id")}">
${head(ctx)}
<body>
${header(ctx)}
  <main class="site-main">
${content}
  </main>
${footer(ctx)}
  <script src="${attr(U.url("/theme/script.js"))}" defer></script>${(ctx.plugins && ctx.plugins.bodyEnd) ? ctx.plugins.bodyEnd(ctx) : ""}
</body>
</html>`;
};
