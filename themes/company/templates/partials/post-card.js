/* ============================================================
   partials/post-card.js — Kartu artikel untuk grid (TEMA)
   Dipakai di beranda (Wawasan Terbaru) & arsip kategori/tag.
   Dipanggil: postCard(post, ctx).
   ============================================================ */

module.exports = function postCard(post, ctx) {
  var config = ctx.config, U = ctx.U, lib = ctx.lib;
  var esc = lib.esc, attr = lib.attr, slugify = lib.slugify, formatDate = lib.formatDate;

  var cat = post.meta.category
    ? '<span class="card-cat">' + esc(post.meta.category) + "</span>"
    : "";
  var img = post.ogImage
    ? '<a href="' + attr(U.url(post.permalink)) + '" class="card-thumb" aria-hidden="true" tabindex="-1"><img src="' + attr(U.url(post.featuredImage)) + '" alt="' + attr(post.meta.title) + '" loading="lazy"></a>'
    : "";

  return (
    '\n      <article class="post-card' + (post.ogImage ? " has-thumb" : "") + '">' +
    "\n        " + img +
    '\n        <div class="card-body">' +
    "\n          " + cat +
    '\n          <h2 class="card-title"><a href="' + attr(U.url(post.permalink)) + '">' + esc(post.meta.title) + "</a></h2>" +
    '\n          <p class="card-excerpt">' + esc(post.excerpt) + "</p>" +
    '\n          <div class="card-meta">' +
    '<time datetime="' + attr(post.meta.date) + '">' + esc(formatDate(post.meta.date, config.language)) + "</time>" +
    '<span class="dot">·</span>' +
    "<span>" + post.readingTime + " menit baca</span>" +
    "\n          </div>" +
    "\n        </div>" +
    "\n      </article>"
  );
};
