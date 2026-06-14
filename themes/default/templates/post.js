/* ============================================================
   templates/post.js — Artikel tunggal (TEMA)
   ctx: { config, U, lib, site, seo, themeVars, post, related }
   ============================================================ */

const layout = require("./partials/layout");

module.exports = function post(ctx) {
  const { config, U, lib, post, related } = ctx;
  const { esc, attr, slugify, formatDate } = lib;

  const cat = post.meta.category
    ? `<a href="${attr(U.url("/category/" + slugify(post.meta.category) + "/"))}" class="post-cat">${esc(post.meta.category)}</a>`
    : "";

  const tags = Array.isArray(post.meta.tags) && post.meta.tags.length
    ? `<div class="post-tags">${post.meta.tags
        .map((t) => `<a href="${attr(U.url("/tag/" + slugify(t) + "/"))}" class="tag">#${esc(t)}</a>`)
        .join("")}</div>`
    : "";

  const featured = post.ogImage
    ? `<figure class="post-hero-img"><img src="${attr(U.url(post.featuredImage))}" alt="${attr(post.meta.title)}"></figure>`
    : "";

  const relatedHtml = related && related.length
    ? `
    <section class="related container">
      <h2 class="related-title">Artikel Lainnya</h2>
      <div class="related-grid">
        ${related.map((p) => `
        <a href="${attr(U.url(p.permalink))}" class="related-card">
          <span class="related-card-title">${esc(p.meta.title)}</span>
          <span class="related-card-date">${esc(formatDate(p.meta.date, config.language))}</span>
        </a>`).join("")}
      </div>
    </section>`
    : "";

  const content = `
    <article class="post">
      <div class="container post-narrow">
        <header class="post-header">
          ${cat}
          <h1 class="post-title">${esc(post.meta.title)}</h1>
          <div class="post-meta">
            ${post.meta.author ? `<span>oleh ${esc(post.meta.author)}</span><span class="dot">·</span>` : ""}
            <time datetime="${attr(post.meta.date)}">${esc(formatDate(post.meta.date, config.language))}</time>
            <span class="dot">·</span>
            <span>${post.readingTime} menit baca</span>
          </div>
        </header>
      </div>
      ${featured}
      <div class="container post-narrow">
        <div class="post-content">
${post.html}
        </div>
        ${tags}
        ${(ctx.plugins && ctx.plugins.contentAfter) ? ctx.plugins.contentAfter(ctx) : ""}
      </div>
    </article>
    ${relatedHtml}`;

  return layout(ctx, content);
};
