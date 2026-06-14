/* ============================================================
   partials/post-card.js — Kartu artikel untuk grid (TEMA)
   Dipakai di beranda & arsip. Dipanggil: postCard(post, ctx).
   ============================================================ */

module.exports = function postCard(post, ctx) {
  const { config, U, lib } = ctx;
  const { esc, attr, slugify, formatDate } = lib;

  const cat = post.meta.category
    ? `<a href="${attr(U.url("/category/" + slugify(post.meta.category) + "/"))}" class="card-cat">${esc(post.meta.category)}</a>`
    : "";
  const img = post.ogImage
    ? `<a href="${attr(U.url(post.permalink))}" class="card-thumb"><img src="${attr(U.url(post.featuredImage))}" alt="${attr(post.meta.title)}" loading="lazy"></a>`
    : "";

  return `
      <article class="post-card${post.ogImage ? " has-thumb" : ""}">
        ${img}
        <div class="card-body">
          ${cat}
          <h2 class="card-title"><a href="${attr(U.url(post.permalink))}">${esc(post.meta.title)}</a></h2>
          <p class="card-excerpt">${esc(post.excerpt)}</p>
          <div class="card-meta">
            <time datetime="${attr(post.meta.date)}">${esc(formatDate(post.meta.date, config.language))}</time>
            <span class="dot">·</span>
            <span>${post.readingTime} menit baca</span>
          </div>
        </div>
      </article>`;
};
