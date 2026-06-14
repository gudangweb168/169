/* ============================================================
   templates/home.js — Beranda landing page (TEMA)
   Halaman 1 = landing company profile (hero, statistik, layanan,
   tentang, wawasan terbaru, CTA). Halaman 2+ = indeks artikel
   sederhana dengan paginasi.
   ctx: { config, U, lib, site, seo, themeVars, posts, pageNum, totalPages }
   ============================================================ */

var layout = require("./partials/layout");
var postCard = require("./partials/post-card");
var icons = require("./partials/icons");
var profileMod = require("./partials/profile");
var getProfile = profileMod.getProfile;
var navHref = profileMod.navHref;

module.exports = function home(ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib, posts = ctx.posts, pageNum = ctx.pageNum, totalPages = ctx.totalPages;
  var esc = lib.esc, attr = lib.attr;

  /* -------- Halaman 2+: indeks artikel sederhana -------- */
  if (pageNum > 1) {
    var cardsP = posts.map(function (p) { return postCard(p, ctx); }).join("");
    var prevP = pageNum > 1
      ? '<a class="page-link" href="' + attr(U.url(pageNum === 2 ? "/" : "/page/" + (pageNum - 1) + "/")) + '">← Sebelumnya</a>'
      : '<span class="page-link disabled">← Sebelumnya</span>';
    var nextP = pageNum < totalPages
      ? '<a class="page-link" href="' + attr(U.url("/page/" + (pageNum + 1) + "/")) + '">Berikutnya →</a>'
      : '<span class="page-link disabled">Berikutnya →</span>';
    var idxContent =
      '\n    <section class="page-head"><div class="container"><span class="page-head-kicker">Wawasan</span><h1>Artikel — Halaman ' + pageNum + "</h1></div></section>" +
      '\n    <section class="section"><div class="container">' +
      '<div class="post-grid">' + cardsP + "</div>" +
      '\n      <nav class="pagination">' + prevP + '<span class="page-info">Halaman ' + pageNum + " dari " + totalPages + "</span>" + nextP + "</nav>" +
      "\n    </div></section>";
    return layout(ctx, idxContent);
  }

  /* -------- Halaman 1: landing -------- */
  var profile = getProfile(ctx);

  // Hero
  var secondary = profile.secondaryCta
    ? '<a class="btn btn-ghost btn-lg" href="' + attr(navHref(U, profile.secondaryCta.url)) + '">' + esc(profile.secondaryCta.text) + "</a>"
    : "";
  var heroText =
    '<div class="hero-text">' +
    '<span class="eyebrow">' + esc(profile.eyebrow) + "</span>" +
    '<h1 class="hero-title">' + esc(profile.headline) + "</h1>" +
    '<p class="hero-lead">' + esc(profile.subheadline) + "</p>" +
    '<div class="hero-actions">' +
    '<a class="btn btn-primary btn-lg" href="' + attr(navHref(U, profile.primaryCta.url)) + '">' + esc(profile.primaryCta.text) + "</a>" +
    secondary +
    "</div>" +
    "</div>";
  var heroMedia = profile.heroImage
    ? '<div class="hero-media"><img src="' + attr(U.url(profile.heroImage)) + '" alt="' + attr(profile.headline) + '"></div>'
    : "";
  var hasBg = !!profile.heroBackground;
  // Mode latar foto > mode gambar samping > hero polos (radial halus).
  var heroClass = hasBg ? " has-bg" : (profile.heroImage ? " has-media" : "");
  var bgStyle = hasBg ? ' style="background-image:url(\'' + attr(U.url(profile.heroBackground)) + '\')"' : "";
  var overlay = hasBg ? '\n      <div class="hero-bg-overlay" aria-hidden="true"></div>' : "";
  var heroInner = hasBg ? heroText : (heroText + heroMedia);
  var hero =
    '\n    <section class="hero' + heroClass + '"' + bgStyle + ">" +
    overlay +
    '\n      <div class="container">' +
    '\n        <div class="hero-inner">' + heroInner + "</div>" +
    "\n      </div>" +
    "\n    </section>";

  // Statistik
  var stats = "";
  if (profile.hasStats) {
    var statItems = profile.stats.map(function (s) {
      return '<div class="stat"><div class="stat-value">' + esc(s.value || "") + '</div><span class="stat-label">' + esc(s.label || "") + "</span></div>";
    }).join("");
    stats = '\n    <section class="stats"><div class="container"><div class="stats-grid">' + statItems + "</div></div></section>";
  }

  // Layanan
  var services = "";
  if (profile.hasServices) {
    var cards = profile.services.map(function (s) {
      var inner =
        '<div class="service-icon">' + icons.featureIcon(s.icon) + "</div>" +
        '<h3 class="service-title">' + esc(s.title || "") + "</h3>" +
        '<p class="service-text">' + esc(s.text || "") + "</p>";
      // Bila URL diisi, kartu menjadi tautan ke halaman detail layanan.
      if (s.url) {
        return (
          '\n        <a class="service-card service-card-link" href="' + attr(navHref(U, s.url)) + '">' +
          inner +
          '<span class="service-more">Selengkapnya ' + icons.arrow() + "</span>" +
          "</a>"
        );
      }
      return '\n        <article class="service-card">' + inner + "</article>";
    }).join("");
    var svcIntro = profile.servicesIntro ? "<p>" + esc(profile.servicesIntro) + "</p>" : "";
    services =
      '\n    <section class="section section-alt" id="layanan">' +
      '\n      <div class="container">' +
      '\n        <div class="section-head center"><span class="eyebrow">' + esc(profile.servicesEyebrow) + '</span><h2>' + esc(profile.servicesTitle) + "</h2>" + svcIntro + "</div>" +
      '\n        <div class="service-grid">' + cards + "</div>" +
      "\n      </div>" +
      "\n    </section>";
  }

  // Tentang
  var about = "";
  if (profile.about) {
    var pointsHtml = profile.about.points.length
      ? '<ul class="about-points">' + profile.about.points.map(function (pt) { return "<li>" + esc(pt) + "</li>"; }).join("") + "</ul>"
      : "";
    var aboutText = profile.about.text ? "<p>" + esc(profile.about.text) + "</p>" : "";
    var aboutMedia = profile.about.image
      ? '<div class="about-media"><img src="' + attr(U.url(profile.about.image)) + '" alt="' + attr(profile.about.title) + '"></div>'
      : '<div class="about-panel"><span class="about-panel-mark">' + esc(config.title) + "</span></div>";
    about =
      '\n    <section class="section" id="tentang">' +
      '\n      <div class="container">' +
      '\n        <div class="about-grid">' +
      '\n          <div class="about-text">' +
      '<span class="eyebrow">' + esc(profile.about.eyebrow) + "</span>" +
      "<h2>" + esc(profile.about.title) + "</h2>" +
      aboutText + pointsHtml +
      "\n          </div>" +
      "\n          " + aboutMedia +
      "\n        </div>" +
      "\n      </div>" +
      "\n    </section>";
  }

  // Wawasan terbaru (maks 3)
  var articles = "";
  if (posts && posts.length) {
    var latest = posts.slice(0, 3);
    var cardsHtml = latest.map(function (p) { return postCard(p, ctx); }).join("");
    articles =
      '\n    <section class="section section-alt" id="artikel">' +
      '\n      <div class="container">' +
      '\n        <div class="articles-head">' +
      '<div class="section-head"><span class="eyebrow">Wawasan</span><h2>Artikel Terbaru</h2></div>' +
      "</div>" +
      '\n        <div class="post-grid">' + cardsHtml + "</div>" +
      "\n      </div>" +
      "\n    </section>";
  }

  // FAQ (opsional, bisa diatur tampil/sembunyi seperti seksi lain)
  var faq = "";
  if (profile.faq) {
    var faqIntro = profile.faq.intro ? "<p>" + esc(profile.faq.intro) + "</p>" : "";
    var faqRows = profile.faq.items.map(function (f, i) {
      // Jawaban: dukung paragraf sederhana (pisah baris kosong) tetap aman (di-escape).
      var answer = String(f.a || "")
        .split(/\n{2,}/)
        .map(function (par) { return "<p>" + esc(par).replace(/\n/g, "<br>") + "</p>"; })
        .join("");
      return (
        '\n        <details class="faq-item"' + (i === 0 ? " open" : "") + ">" +
        '<summary class="faq-q">' + esc(f.q) + '<span class="faq-ic" aria-hidden="true"></span></summary>' +
        '<div class="faq-a">' + answer + "</div>" +
        "</details>"
      );
    }).join("");

    // Schema FAQPage (AEO/SEO): bantu mesin jawaban memahami daftar tanya-jawab.
    var faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: profile.faq.items.map(function (f) {
        return {
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: String(f.a || "").replace(/\s+/g, " ").trim() },
        };
      }),
    };
    var faqLdTag = '\n      <script type="application/ld+json">' + JSON.stringify(faqLd).replace(/</g, "\\u003c") + "</script>";

    faq =
      '\n    <section class="section" id="faq">' +
      '\n      <div class="container container-narrow">' +
      '\n        <div class="section-head center"><span class="eyebrow">' + esc(profile.faq.eyebrow) + '</span><h2>' + esc(profile.faq.title) + "</h2>" + faqIntro + "</div>" +
      '\n        <div class="faq-list">' + faqRows + "</div>" +
      faqLdTag +
      "\n      </div>" +
      "\n    </section>";
  }

  // CTA band
  var ctaBand = "";
  if (profile.ctaBand) {
    var bandText = profile.ctaBand.text ? "<p>" + esc(profile.ctaBand.text) + "</p>" : "";
    ctaBand =
      '\n    <section class="cta-band">' +
      '\n      <div class="container"><div class="cta-inner">' +
      "<h2>" + esc(profile.ctaBand.title) + "</h2>" + bandText +
      '<div class="cta-actions"><a class="btn btn-light btn-lg" href="' + attr(navHref(U, profile.ctaBand.button.url)) + '">' + esc(profile.ctaBand.button.text) + "</a></div>" +
      "</div></div>" +
      "\n    </section>";
  }

  var content = hero + stats + services + about + articles + faq + ctaBand;
  return layout(ctx, content);
};
