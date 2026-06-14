/* ============================================================
   partials/head.js — <head> dokumen (TEMA)
   Merender meta description, canonical, Open Graph, Twitter Card,
   font, stylesheet, dan JSON-LD. SEMUA data SEO berasal dari core
   (ctx.seo) sehingga tema tidak perlu tahu schema apa pun —
   cukup merendernya. Inilah yang membuat tema baru otomatis
   SEO-ready selama memanggil partial ini.
   ============================================================ */

// Suntikan CSS variable dari opsi tema (theme.json → ctx.themeVars).
// Diletakkan SETELAH stylesheet agar menimpa nilai default tema.
function themeVarStyle(themeVars) {
  const keys = Object.keys(themeVars || {});
  if (!keys.length) return "";
  const decl = keys.map((k) => `${k}: ${themeVars[k]};`).join(" ");
  return `\n  <style>:root{ ${decl} }</style>`;
}

module.exports = function head(ctx) {
  const { config, U, lib, seo } = ctx;
  const { esc, attr } = lib;

  const siteName = esc(config.title);
  const title = seo.title ? `${esc(seo.title)} — ${siteName}` : siteName;
  const desc = attr(seo.description || config.description || "");
  const canonical = attr(seo.canonical || U.baseUrl + "/");
  const ogType = seo.ogType || "website";
  const ogImage = seo.ogImage
    ? attr(seo.ogImage)
    : (config.defaultOgImage ? attr(U.abs(config.defaultOgImage)) : "");

  const ogImageTags = ogImage
    ? `\n  <meta property="og:image" content="${ogImage}">\n  <meta name="twitter:image" content="${ogImage}">`
    : "";

  const favicon = config.favicon
    ? `\n  <link rel="icon" href="${attr(U.url(config.favicon))}">`
    : "";

  const jsonLd = (seo.jsonLd && seo.jsonLd.length)
    ? "\n  " + seo.jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n  ")
    : "";

  const themeVars = themeVarStyle(ctx.themeVars);

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow">${favicon}

  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${attr(seo.title || config.title)}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:locale" content="${attr((config.language || "id") === "id" ? "id_ID" : config.language)}">${ogImageTags}

  <meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
  <meta name="twitter:title" content="${attr(seo.title || config.title)}">
  <meta name="twitter:description" content="${desc}">

  <link rel="alternate" type="application/rss+xml" title="${siteName}" href="${attr(U.url("/rss.xml"))}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${attr(U.url("/theme/style.css"))}">${themeVars}${jsonLd}${(ctx.plugins && ctx.plugins.headExtra) ? ctx.plugins.headExtra(ctx) : ""}
</head>`;
};
