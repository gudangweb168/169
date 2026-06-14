/* ============================================================
   partials/head.js — <head> dokumen (TEMA)
   Merender meta description, canonical, Open Graph, Twitter Card,
   font, stylesheet, dan JSON-LD. SEMUA data SEO berasal dari inti
   (ctx.seo) — tema cukup merendernya, sehingga tema ini otomatis
   SEO-ready persis seperti tema default.
   ============================================================ */

// Suntikan CSS variable dari opsi tema (theme.json → ctx.themeVars).
// Diletakkan SETELAH stylesheet agar menimpa nilai default tema.
function themeVarStyle(themeVars) {
  var keys = Object.keys(themeVars || {});
  if (!keys.length) return "";
  var decl = keys.map(function (k) { return k + ": " + themeVars[k] + ";"; }).join(" ");
  return "\n  <style>:root{ " + decl + " }</style>";
}

module.exports = function head(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib, seo = ctx.seo;
  var esc = lib.esc, attr = lib.attr;

  var siteName = esc(config.title);
  var title = seo.title ? esc(seo.title) + " — " + siteName : siteName;
  var desc = attr(seo.description || config.description || "");
  var canonical = attr(seo.canonical || U.baseUrl + "/");
  var ogType = seo.ogType || "website";
  var ogImage = seo.ogImage
    ? attr(seo.ogImage)
    : (config.defaultOgImage ? attr(U.abs(config.defaultOgImage)) : "");

  var ogImageTags = ogImage
    ? '\n  <meta property="og:image" content="' + ogImage + '">\n  <meta name="twitter:image" content="' + ogImage + '">'
    : "";

  var favicon = config.favicon
    ? '\n  <link rel="icon" href="' + attr(U.url(config.favicon)) + '">'
    : "";

  var jsonLd = (seo.jsonLd && seo.jsonLd.length)
    ? "\n  " + seo.jsonLd.map(function (o) { return '<script type="application/ld+json">' + JSON.stringify(o) + "</script>"; }).join("\n  ")
    : "";

  var themeVars = themeVarStyle(ctx.themeVars);

  // HTML tambahan dari plugin untuk <head> (mis. gaya FAQ).
  var pluginHead = (ctx.plugins && ctx.plugins.headExtra) ? ctx.plugins.headExtra(ctx) : "";

  return '<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>' + title + '</title>\n  <meta name="description" content="' + desc + '">\n  <link rel="canonical" href="' + canonical + '">\n  <meta name="robots" content="index, follow">' + favicon + '\n\n  <meta property="og:type" content="' + ogType + '">\n  <meta property="og:title" content="' + attr(seo.title || config.title) + '">\n  <meta property="og:description" content="' + desc + '">\n  <meta property="og:url" content="' + canonical + '">\n  <meta property="og:site_name" content="' + siteName + '">\n  <meta property="og:locale" content="' + attr((config.language || "id") === "id" ? "id_ID" : config.language) + '">' + ogImageTags + '\n\n  <meta name="twitter:card" content="' + (ogImage ? "summary_large_image" : "summary") + '">\n  <meta name="twitter:title" content="' + attr(seo.title || config.title) + '">\n  <meta name="twitter:description" content="' + desc + '">\n\n  <link rel="alternate" type="application/rss+xml" title="' + siteName + '" href="' + attr(U.url("/rss.xml")) + '">\n\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">\n  <link rel="stylesheet" href="' + attr(U.url("/theme/style.css")) + '">' + themeVars + jsonLd + pluginHead + "\n</head>";
};
