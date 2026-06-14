/* ============================================================
   plugins/whatsapp-overlay/plugin.js — Plugin WhatsApp Overlay
   ------------------------------------------------------------
   Saat AKTIF & nomor diisi, menampilkan tombol mengambang WhatsApp
   di sudut bawah (kanan/kiri) pada SEMUA halaman publik. Opsional:
   gelembung sapaan (greeting) yang muncul otomatis dan bisa ditutup.

   Pengaturan (content/plugins.json → settings):
     phone     : nomor tujuan, format internasional tanpa "+" (mis. 6281234567890)
     message   : teks awal yang otomatis terisi di WhatsApp
     tooltip   : teks kecil saat kursor di atas tombol (judul aksesibilitas)
     greeting  : isi gelembung sapaan (kosongkan untuk menonaktifkan)
     position  : "right" (default) atau "left"

   Plugin self-contained: membawa gaya & skrip sendiri lewat hook
   `bodyEnd`, jadi tidak bergantung pada tema apa pun.
   ============================================================ */

function attrFn(ctx) {
  if (ctx && ctx.lib && typeof ctx.lib.attr === "function") return ctx.lib.attr;
  return function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };
}

module.exports = {
  id: "whatsapp-overlay",
  name: "WhatsApp Overlay",
  description:
    "Tombol WhatsApp mengambang di sudut bawah halaman, dengan gelembung sapaan opsional. Klik membuka chat ke nomor yang Anda tentukan.",
  version: "1.0.0",

  hooks: {
    bodyEnd: function (ctx, self) {
      const s = (self && self.settings) || {};
      const phone = String(s.phone || "").replace(/[^0-9]/g, "");
      if (!phone) return ""; // belum dikonfigurasi → jangan render apa pun

      const attr = attrFn(ctx);
      const message = String(s.message || "").trim();
      const tooltip = String(s.tooltip || "Chat via WhatsApp").trim();
      const greeting = String(s.greeting || "").trim();
      const side = s.position === "left" ? "left" : "right";

      const href =
        "https://wa.me/" + phone + (message ? "?text=" + encodeURIComponent(message) : "");

      // Ikon WhatsApp (inline SVG, putih).
      const icon =
        '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false">' +
        '<path fill="#fff" d="M16.04 3.2c-7.06 0-12.8 5.73-12.8 12.79 0 2.25.59 4.45 1.71 6.39L3.2 28.8l6.6-1.73a12.77 12.77 0 0 0 6.23 1.59h.01c7.05 0 12.79-5.74 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05a12.7 12.7 0 0 0-9.04-3.61zm0 23.42h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.02 1.05 1.07-3.92-.25-.4a10.6 10.6 0 0 1-1.62-5.65c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.87-4.77 10.64-10.63 10.64zm5.83-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1.01 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.82.67.76.24 1.46.21 2.01.13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37z"/>' +
        "</svg>";

      const greetingHtml = greeting
        ? '<div class="gc-wa__bubble" id="gc-wa-bubble" role="dialog" aria-label="' +
          attr(tooltip) +
          '">' +
          '<button type="button" class="gc-wa__bubble-x" id="gc-wa-bubble-x" aria-label="Tutup">&times;</button>' +
          '<a class="gc-wa__bubble-link" href="' +
          attr(href) +
          '" target="_blank" rel="noopener noreferrer">' +
          attr(greeting) +
          "</a>" +
          "</div>"
        : "";

      const style =
        "<style>" +
        ".gc-wa{position:fixed;bottom:22px;z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:12px;}" +
        ".gc-wa--right{right:22px;align-items:flex-end;}" +
        ".gc-wa--left{left:22px;align-items:flex-start;}" +
        ".gc-wa__btn{display:flex;align-items:center;justify-content:center;width:58px;height:58px;border-radius:50%;background:#25d366;box-shadow:0 8px 24px rgba(0,0,0,.22);transition:transform .18s ease,box-shadow .18s ease;animation:gc-wa-pop .4s ease both;}" +
        ".gc-wa__btn:hover{transform:scale(1.06);box-shadow:0 12px 30px rgba(0,0,0,.28);}" +
        ".gc-wa__btn:active{transform:scale(.97);}" +
        ".gc-wa__bubble{position:relative;max-width:260px;background:#fff;color:#1f2937;border-radius:14px;padding:14px 34px 14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.16);font-size:14px;line-height:1.5;animation:gc-wa-fade .3s ease both;}" +
        ".gc-wa--right .gc-wa__bubble{border-bottom-right-radius:4px;}" +
        ".gc-wa--left .gc-wa__bubble{border-bottom-left-radius:4px;}" +
        ".gc-wa__bubble-link{color:inherit;text-decoration:none;display:block;}" +
        ".gc-wa__bubble-x{position:absolute;top:6px;right:8px;border:0;background:transparent;font-size:18px;line-height:1;color:#9ca3af;cursor:pointer;padding:2px 4px;border-radius:6px;}" +
        ".gc-wa__bubble-x:hover{color:#4b5563;background:#f3f4f6;}" +
        ".gc-wa__hidden{display:none!important;}" +
        "@keyframes gc-wa-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}" +
        "@keyframes gc-wa-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}" +
        "@media (max-width:560px){.gc-wa{bottom:16px;}.gc-wa--right{right:16px;}.gc-wa--left{left:16px;}.gc-wa__btn{width:54px;height:54px;}.gc-wa__bubble{max-width:220px;}}" +
        "</style>";

      const script = greeting
        ? "<script>(function(){try{var b=document.getElementById('gc-wa-bubble');var x=document.getElementById('gc-wa-bubble-x');if(!b)return;if(sessionStorage.getItem('gcWaClosed')==='1'){b.classList.add('gc-wa__hidden');}else{b.classList.add('gc-wa__hidden');setTimeout(function(){b.classList.remove('gc-wa__hidden');},1200);}if(x){x.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();b.classList.add('gc-wa__hidden');try{sessionStorage.setItem('gcWaClosed','1');}catch(_){}});}}catch(_){}})();</script>"
        : "";

      return (
        "\n  " +
        style +
        '\n  <div class="gc-wa gc-wa--' + side + '" id="gc-wa">' +
        greetingHtml +
        '<a class="gc-wa__btn" href="' + attr(href) + '" target="_blank" rel="noopener noreferrer" title="' + attr(tooltip) + '" aria-label="' + attr(tooltip) + '">' +
        icon +
        "</a>" +
        "</div>" +
        script
      );
    },
  },
};
