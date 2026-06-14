/* ============================================================
   customizer.js — Mesin "Customize" berbasis skema (CORE / ADMIN)

   Membaca theme.json → customize (options + sections + fields) milik
   tema AKTIF lalu MERENDER form secara otomatis. Tidak ada field yang
   di-hardcode: tema apa pun yang menyertakan skema customize akan
   langsung punya panel Sesuaikan yang sesuai — persis pola Customizer
   WordPress / theme.json block themes.

   KONTRAK: modul ini hanya membaca skema & data, lalu mengembalikan
   data hasil edit. Ia TIDAK menyentuh GitHub API / filesystem; operasi
   media & penyimpanan didelegasikan ke "host" (app.js) lewat bridge.

   Tipe field yang didukung:
     text, textarea, number, select, color, checkbox, image, note,
     group (pembungkus visual; menulis ke objek bersarang),
     linklist (textarea "Label | URL" → array {label,url}),
     repeater (array objek), repeater itemType:"string" (array string),
     repeater bertipe (typeField + variants) → blok seperti sidebar.

   Kunci field boleh memakai notasi titik (mis. "about.points",
   "ctaBand.button.url") untuk menulis ke struktur bersarang.
   ============================================================ */

var Customizer = (function () {
  /* ---------- Bridge ke host (app.js) ---------- */
  // { esc, toast, imagePreviewUrl, normalizeImagePath, openMediaPicker(cb), uploadImage(cb) }
  var host = null;

  /* ---------- State ---------- */
  var manifest = null;     // theme.json tema aktif
  var schema = null;       // manifest.customize ternormalisasi
  var data = null;         // draft kerja: { options:{}, content:{} }
  var sections = [];       // daftar seksi termasuk pseudo-seksi "Tampilan"
  var activeId = null;     // id seksi aktif
  var els = {};            // { nav, body } elemen kontainer

  /* ---------- Util DOM ---------- */
  function $(sel) { return document.querySelector(sel); }
  function esc(s) { return host && host.esc ? host.esc(s) : String(s == null ? "" : s); }
  function cid(path) { return "cz_" + String(path).replace(/[^a-zA-Z0-9]/g, "_"); }

  /* ---------- get/set jalur bertitik ---------- */
  function getPath(obj, path) {
    if (!obj) return undefined;
    var parts = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }
  function setPath(obj, path, val) {
    var parts = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (cur[k] == null || typeof cur[k] !== "object" || Array.isArray(cur[k])) cur[k] = {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = val;
  }

  /* ---------- Inisialisasi bridge ---------- */
  function init(bridge) { host = bridge || {}; }

  /* ---------- Normalisasi skema ---------- */
  function normalizeSchema(m) {
    var c = (m && m.customize && typeof m.customize === "object") ? m.customize : {};
    var opts = (c.options && typeof c.options === "object") ? c.options
             : (m && m.options && typeof m.options === "object") ? m.options : {};
    var secs = Array.isArray(c.sections) ? c.sections : [];
    return { options: opts, sections: secs };
  }

  /* ---------- Muat & render ---------- */
  function load(opts) {
    manifest = opts.manifest || {};
    schema = normalizeSchema(manifest);
    var d = opts.data || {};
    data = {
      options: (d.options && typeof d.options === "object") ? JSON.parse(JSON.stringify(d.options)) : {},
      content: (d.content && typeof d.content === "object") ? JSON.parse(JSON.stringify(d.content)) : {},
    };
    els.nav = $(opts.navSel);
    els.body = $(opts.bodySel);

    // Susun daftar seksi: pseudo "Tampilan" (opsi CSS) + seksi konten.
    sections = [];
    if (Object.keys(schema.options).length) {
      sections.push({ id: "__appearance", label: "Tampilan", icon: "◧", isOptions: true });
    }
    schema.sections.forEach(function (s) {
      if (s && s.id) sections.push(s);
    });

    activeId = sections.length ? sections[0].id : null;
    render();
    return sections.length;
  }

  function hasAnything() {
    return Object.keys(schema.options).length > 0 || schema.sections.length > 0;
  }

  function render() {
    renderNav();
    renderBody();
  }

  function renderNav() {
    if (!els.nav) return;
    if (!sections.length) { els.nav.innerHTML = ""; return; }
    els.nav.innerHTML = sections.map(function (s) {
      var active = s.id === activeId ? " active" : "";
      var icon = s.icon ? '<span class="cz-nav-icon">' + esc(s.icon) + "</span>" : "";
      return '<button type="button" class="cz-nav-item' + active + '" onclick="Customizer.go(\'' + s.id + '\')">' +
        icon + "<span>" + esc(s.label || s.id) + "</span></button>";
    }).join("");
  }

  function go(id) {
    collectActive();          // simpan dulu seksi yang sedang tampil
    activeId = id;
    render();
    if (els.body) els.body.scrollTop = 0;
  }

  function currentSection() {
    for (var i = 0; i < sections.length; i++) if (sections[i].id === activeId) return sections[i];
    return null;
  }

  /* ============================================================
     RENDER BODY
     ============================================================ */
  function renderBody() {
    if (!els.body) return;
    var sec = currentSection();
    if (!sec) { els.body.innerHTML = '<p class="cz-empty">Tema ini tidak menyediakan opsi yang dapat dikonfigurasi.</p>'; return; }

    var head = "";
    if (sec.description) head = '<p class="cz-sec-desc">' + esc(sec.description) + "</p>";

    if (sec.isOptions) {
      els.body.innerHTML = head + renderOptions();
      bindColorSync(els.body);
      return;
    }
    var fields = Array.isArray(sec.fields) ? sec.fields : [];
    els.body.innerHTML = head + fields.map(function (f) { return renderField(f, ""); }).join("");
    bindColorSync(els.body);
  }

  /* ---------- Opsi tema (CSS variable) ---------- */
  function renderOptions() {
    var defs = schema.options;
    return Object.keys(defs).map(function (key) {
      var opt = defs[key] || {};
      var def = opt.default != null ? String(opt.default) : "";
      var saved = Object.prototype.hasOwnProperty.call(data.options, key) ? String(data.options[key]) : def;
      var id = "cz_opt_" + key.replace(/[^a-zA-Z0-9]/g, "_");
      var control;
      if (opt.type === "color") {
        var v = saved || "#000000";
        control = '<div class="cz-color-row">' +
          '<input type="color" id="' + id + '" data-cz-opt="' + esc(key) + '" value="' + esc(v) + '" />' +
          '<input type="text" class="cz-color-hex" data-for="' + id + '" value="' + esc(v) + '" spellcheck="false" /></div>';
      } else if (opt.type === "select" && Array.isArray(opt.choices)) {
        var choices = opt.choices.map(function (c) {
          return '<option value="' + esc(String(c)) + '"' + (String(c) === saved ? " selected" : "") + ">" + esc(String(c)) + "</option>";
        }).join("");
        control = '<select id="' + id + '" data-cz-opt="' + esc(key) + '">' + choices + "</select>";
      } else if (opt.type === "number") {
        control = '<input type="number" id="' + id + '" data-cz-opt="' + esc(key) + '" value="' + esc(saved) + '" />';
      } else {
        control = '<input type="text" id="' + id + '" data-cz-opt="' + esc(key) + '" value="' + esc(saved) + '" />';
      }
      var hint = def ? '<small class="cz-hint">Bawaan: <code>' + esc(def) + "</code></small>" : "";
      return '<div class="cz-field"><label for="' + id + '">' + esc(opt.label || key) + "</label>" + control + hint + "</div>";
    }).join("");
  }

  /* ---------- Render satu field konten ---------- */
  function renderField(f, prefix) {
    f = f || {};
    var path = prefix ? prefix + "." + f.key : f.key;
    var type = f.type || "text";
    var label = f.label != null ? f.label : "";
    var hint = f.hint ? '<small class="cz-hint">' + esc(f.hint) + "</small>" : "";

    if (type === "note") {
      return '<p class="cz-note">' + esc(label) + "</p>";
    }
    if (type === "group") {
      var inner = (Array.isArray(f.fields) ? f.fields : []).map(function (cf) {
        return renderField(cf, path);
      }).join("");
      var wrapClass = f.layout === "row" ? "cz-grid" : "cz-group-body";
      var head = label ? '<div class="cz-group-label">' + esc(label) + "</div>" : "";
      return '<div class="cz-group">' + head + '<div class="' + wrapClass + '">' + inner + "</div></div>";
    }
    if (type === "repeater") {
      return renderRepeater(f, path);
    }

    // Field skalar tunggal
    var id = cid(path);
    var val = getPath(data.content, path);
    var control = renderControl(type, id, val, f, "data-cz-path");
    return '<div class="cz-field"><label for="' + id + '">' + esc(label) + "</label>" + control + hint + "</div>";
  }

  /* ---------- Kontrol skalar generik ----------
     attrName = atribut penanda jalur ("data-cz-path" utk top-level,
     "data-rowfield" utk dalam baris repeater). */
  function renderControl(type, id, val, f, attrName, attrVal) {
    var mark = attrName + '="' + esc(attrVal != null ? attrVal : id) + '"';
    if (type === "textarea") {
      return '<textarea id="' + id + '" ' + mark + ' rows="' + (f.rows || 2) + '"' +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + ">" + esc(val || "") + "</textarea>";
    }
    if (type === "number") {
      var nv = (val === 0 || val) ? val : (f.default != null ? f.default : "");
      return '<input type="number" id="' + id + '" ' + mark + ' value="' + esc(String(nv)) + '"' +
        (f.min != null ? ' min="' + esc(String(f.min)) + '"' : "") +
        (f.max != null ? ' max="' + esc(String(f.max)) + '"' : "") + " />";
    }
    if (type === "checkbox") {
      var checked = (val === undefined ? (f.default !== false ? !!f.default : false) : !!val);
      // Default true bila f.default===true; bila tidak ada nilai & default true → checked.
      var isChecked = (val === undefined) ? (f.default === true) : !!val;
      return '<label class="cz-check"><input type="checkbox" id="' + id + '" ' + mark + (isChecked ? " checked" : "") +
        ' /> <span>' + esc(f.label || "") + "</span></label>";
    }
    if (type === "select" && Array.isArray(f.choices)) {
      var cur = (val != null && val !== "") ? String(val) : (f.default != null ? String(f.default) : "");
      var choices = f.choices.map(function (c) {
        return '<option value="' + esc(String(c)) + '"' + (String(c) === cur ? " selected" : "") + ">" + esc(String(c)) + "</option>";
      }).join("");
      return '<select id="' + id + '" ' + mark + ">" + choices + "</select>";
    }
    if (type === "color") {
      var cv = val || (f.default != null ? f.default : "#000000");
      return '<div class="cz-color-row"><input type="color" id="' + id + '" ' + mark + ' value="' + esc(cv) + '" />' +
        '<input type="text" class="cz-color-hex" data-for="' + id + '" value="' + esc(cv) + '" spellcheck="false" /></div>';
    }
    if (type === "image") {
      return renderImage(id, val, attrName, attrVal);
    }
    if (type === "linklist") {
      var lines = "";
      if (Array.isArray(val)) lines = val.map(function (it) { it = it || {}; return (it.label || "") + " | " + (it.url || ""); }).join("\n");
      else if (typeof val === "string") lines = val;
      return '<textarea id="' + id + '" ' + mark + ' data-cz-linklist="1" rows="' + (f.rows || 4) + '"' +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + ">" + esc(lines) + "</textarea>";
    }
    // default: text
    return '<input type="text" id="' + id + '" ' + mark + ' value="' + esc(val || "") + '"' +
      (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + " />";
  }

  /* ---------- Field gambar (preview + pilih/upload) ---------- */
  function renderImage(id, val, attrName, attrVal) {
    var v = val || "";
    var mark = attrName + '="' + esc(attrVal != null ? attrVal : id) + '"';
    var prevSrc = v && host.imagePreviewUrl ? host.imagePreviewUrl(v) : "";
    return '<div class="cz-image">' +
      '<img id="' + id + '_prev" class="cz-image-prev' + (v ? "" : " hidden") + '" src="' + esc(prevSrc) + '" alt="" />' +
      '<input type="text" id="' + id + '" ' + mark + ' value="' + esc(v) + '" placeholder="/public/images/..." oninput="Customizer.refreshImage(\'' + id + '\')" />' +
      '<div class="cz-image-actions">' +
        '<button type="button" class="btn btn-ghost btn-small" onclick="Customizer.pickImage(\'' + id + '\')">Pilih dari Media</button>' +
        '<button type="button" class="btn btn-ghost btn-small" onclick="Customizer.uploadImage(\'' + id + '\')">Upload</button>' +
      "</div></div>";
  }

  /* ============================================================
     REPEATER
     ============================================================ */
  function repeaterArray(path) {
    var v = getPath(data.content, path);
    if (!Array.isArray(v)) { v = []; setPath(data.content, path, v); }
    return v;
  }

  function renderRepeater(f, path) {
    var list = repeaterArray(path);
    var rid = "cz_rep_" + cid(path);
    var label = f.label ? '<label class="cz-rep-label">' + esc(f.label) + "</label>" : "";
    var rows;
    if (!list.length) {
      rows = '<p class="cz-rep-empty">Belum ada item.</p>';
    } else {
      rows = list.map(function (item, i) { return renderRow(f, path, item, i); }).join("");
    }
    var addLabel = f.addLabel || "+ Tambah Item";
    var add = '<button type="button" class="btn btn-ghost btn-small cz-rep-add" onclick="Customizer.add(\'' + esc(path) + '\')">' + esc(addLabel) + "</button>";
    return '<div class="cz-repeater" data-cz-repeater="' + esc(path) + '">' + label +
      '<div class="cz-rows" id="' + rid + '">' + rows + "</div>" + add + "</div>";
  }

  function rowHead(path, i, itemLabel) {
    var lbl = (itemLabel || "Item") + " #" + (i + 1);
    var p = esc(path);
    var up = 'onclick="Customizer.move(\'' + p + "'," + i + ',-1)"';
    var down = 'onclick="Customizer.move(\'' + p + "'," + i + ',1)"';
    var del = 'onclick="Customizer.remove(\'' + p + "'," + i + ')"';
    return '<div class="cz-row-head"><span class="cz-row-label">' + esc(lbl) + "</span>" +
      '<div class="cz-row-actions">' +
        '<button type="button" class="btn btn-ghost btn-icon" title="Naik" ' + up + ">\u2191</button>" +
        '<button type="button" class="btn btn-ghost btn-icon" title="Turun" ' + down + ">\u2193</button>" +
        '<button type="button" class="btn btn-ghost btn-icon" title="Hapus" ' + del + ">\uD83D\uDDD1</button>" +
      "</div></div>";
  }

  function renderRow(f, path, item, i) {
    var rid = "cz_rep_" + cid(path);
    var itemLabel = f.itemLabel || "Item";

    // 1) Repeater skalar (array string)
    if (f.itemType === "string") {
      var sval = (typeof item === "string") ? item : (item && item.point) || "";
      var sid = rid + "_" + i;
      return '<div class="cz-row" data-cz-row="' + i + '">' + rowHead(path, i, itemLabel) +
        '<div class="cz-field"><input type="text" id="' + sid + '" data-rowscalar="1" value="' + esc(sval) + '"' +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + " /></div></div>";
    }

    // 2) Repeater bertipe (typeField + variants) → blok seperti sidebar
    if (f.typeField && f.variants) {
      item = item || {};
      var curType = item[f.typeField] || (f.typeChoices && f.typeChoices[0] && f.typeChoices[0][0]) || "";
      var typeSelId = rid + "_" + i + "__type";
      var typeOpts = (f.typeChoices || []).map(function (pair) {
        return '<option value="' + esc(pair[0]) + '"' + (pair[0] === curType ? " selected" : "") + ">" + esc(pair[1]) + "</option>";
      }).join("");
      var typeField = '<div class="cz-field"><label>' + esc(f.typeLabel || "Tipe") + "</label>" +
        '<select id="' + typeSelId + '" data-rowtype="1" onchange="Customizer.rowType(\'' + esc(path) + "'," + i + ",this.value)\">" + typeOpts + "</select></div>";

      var common = (f.common || []).map(function (cf) { return renderRowField(cf, rid, i, item, ""); }).join("");
      var variant = (f.variants[curType] || []).map(function (cf) { return renderRowField(cf, rid, i, item, ""); }).join("");

      return '<div class="cz-row" data-cz-row="' + i + '" data-row-type="' + esc(curType) + '">' +
        rowHead(path, i, itemLabel) + typeField + common + variant + "</div>";
    }

    // 3) Repeater objek biasa
    item = item || {};
    var body = (f.fields || []).map(function (cf) { return renderRowField(cf, rid, i, item, ""); }).join("");
    return '<div class="cz-row" data-cz-row="' + i + '">' + rowHead(path, i, itemLabel) + body + "</div>";
  }

  // Field di dalam baris repeater (jalur relatif terhadap item).
  function renderRowField(f, rid, i, item, prefix) {
    f = f || {};
    var rel = prefix ? prefix + "." + f.key : f.key;
    var type = f.type || "text";
    var label = f.label != null ? f.label : "";
    var id = rid + "_" + i + "_" + rel.replace(/[^a-zA-Z0-9]/g, "_");

    if (type === "note") return '<p class="cz-note">' + esc(label) + "</p>";

    if (type === "group") {
      var inner = (f.fields || []).map(function (cf) { return renderRowField(cf, rid, i, item, rel); }).join("");
      var wrapClass = f.layout === "row" ? "cz-grid" : "cz-group-body";
      var head = label ? '<div class="cz-group-label">' + esc(label) + "</div>" : "";
      return '<div class="cz-group">' + head + '<div class="' + wrapClass + '">' + inner + "</div></div>";
    }

    var val = getPath(item, rel);
    var control = renderControl(type, id, val, f, "data-rowfield", rel);
    if (type === "checkbox") return '<div class="cz-field">' + control + "</div>";
    return '<div class="cz-field"><label for="' + id + '">' + esc(label) + "</label>" + control + "</div>";
  }

  /* ============================================================
     BACA NILAI (DOM → data)
     ============================================================ */
  // Baca seluruh field seksi aktif kembali ke `data`.
  function collectActive() {
    var sec = currentSection();
    if (!sec || !els.body) return;
    if (sec.isOptions) { collectOptions(); return; }
    (sec.fields || []).forEach(function (f) { collectField(f, ""); });
  }

  function collectOptions() {
    var nodes = els.body.querySelectorAll("[data-cz-opt]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-cz-opt");
      var v = String(el.value).trim();
      var def = schema.options[key] && schema.options[key].default != null ? String(schema.options[key].default) : "";
      if (v === "" || v === def) { delete data.options[key]; }
      else { data.options[key] = v; }
    });
  }

  function collectField(f, prefix) {
    f = f || {};
    var path = prefix ? prefix + "." + f.key : f.key;
    var type = f.type || "text";

    if (type === "note") return;
    if (type === "group") {
      (f.fields || []).forEach(function (cf) { collectField(cf, path); });
      return;
    }
    if (type === "repeater") { collectRepeater(f, path); return; }

    var id = cid(path);
    var el = document.getElementById(id);
    if (!el) return;
    setPath(data.content, path, readScalar(type, el, f));
  }

  function readScalar(type, el, f) {
    if (type === "checkbox") return !!el.checked;
    if (type === "number") {
      var n = parseInt(el.value, 10);
      if (isNaN(n)) n = (f && f.default != null) ? f.default : 0;
      return n;
    }
    if (type === "linklist") {
      return String(el.value).split("\n").map(function (line) {
        var pr = line.split("|");
        return { label: (pr[0] || "").trim(), url: (pr[1] || "").trim() };
      }).filter(function (it) { return it.label; });
    }
    if (type === "image") return String(el.value).trim();
    if (type === "textarea") return el.value;
    return String(el.value).trim();
  }

  function collectRepeater(f, path) {
    var rid = "cz_rep_" + cid(path);
    var container = document.getElementById(rid);
    if (!container) return;
    var rows = container.querySelectorAll(":scope > .cz-row");
    var out = [];
    Array.prototype.forEach.call(rows, function (row, i) {
      out.push(readRow(f, rid, i, row));
    });
    setPath(data.content, path, out);
  }

  function readRow(f, rid, i, row) {
    // Skalar
    if (f.itemType === "string") {
      var sid = rid + "_" + i;
      var el = document.getElementById(sid);
      return el ? String(el.value).trim() : "";
    }
    // Bertipe
    if (f.typeField && f.variants) {
      var typeSel = document.getElementById(rid + "_" + i + "__type");
      var t = typeSel ? typeSel.value : (f.typeChoices && f.typeChoices[0] && f.typeChoices[0][0]) || "";
      var obj = {};
      obj[f.typeField] = t;
      (f.common || []).forEach(function (cf) { readRowField(cf, rid, i, obj, ""); });
      (f.variants[t] || []).forEach(function (cf) { readRowField(cf, rid, i, obj, ""); });
      return obj;
    }
    // Objek biasa
    var item = {};
    (f.fields || []).forEach(function (cf) { readRowField(cf, rid, i, item, ""); });
    return item;
  }

  function readRowField(f, rid, i, target, prefix) {
    f = f || {};
    var rel = prefix ? prefix + "." + f.key : f.key;
    var type = f.type || "text";
    if (type === "note") return;
    if (type === "group") {
      (f.fields || []).forEach(function (cf) { readRowField(cf, rid, i, target, rel); });
      return;
    }
    var id = rid + "_" + i + "_" + rel.replace(/[^a-zA-Z0-9]/g, "_");
    var el = document.getElementById(id);
    if (!el) return;
    setPath(target, rel, readScalar(type, el, f));
  }

  /* ============================================================
     AKSI REPEATER (dipanggil dari onclick)
     ============================================================ */
  function blankItem(f) {
    if (f.itemType === "string") return "";
    if (f.typeField && f.variants) {
      var o = {};
      o[f.typeField] = (f.typeChoices && f.typeChoices[0] && f.typeChoices[0][0]) || "text";
      return o;
    }
    return {};
  }

  // Temukan definisi field repeater berdasarkan path di seksi aktif.
  function findRepeaterDef(path) {
    var found = null;
    var sec = currentSection();
    if (!sec || sec.isOptions) return null;
    (function walk(fields, prefix) {
      (fields || []).forEach(function (f) {
        var p = prefix ? prefix + "." + f.key : f.key;
        if (f.type === "repeater" && p === path) found = f;
        else if (f.type === "group") walk(f.fields, p);
      });
    })(sec.fields, "");
    return found;
  }

  function add(path) {
    collectActive();
    var f = findRepeaterDef(path);
    if (!f) return;
    var list = repeaterArray(path);
    list.push(blankItem(f));
    renderBody();
    bindColorSync(els.body);
  }
  function remove(path, i) {
    collectActive();
    var list = repeaterArray(path);
    if (i >= 0 && i < list.length) list.splice(i, 1);
    renderBody();
    bindColorSync(els.body);
  }
  function move(path, i, dir) {
    collectActive();
    var list = repeaterArray(path);
    var j = i + dir;
    if (j < 0 || j >= list.length) return;
    var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    renderBody();
    bindColorSync(els.body);
  }
  function rowType(path, i, type) {
    collectActive();
    var f = findRepeaterDef(path);
    var list = repeaterArray(path);
    if (f && list[i]) list[i][f.typeField] = type;
    renderBody();
    bindColorSync(els.body);
  }

  /* ============================================================
     GAMBAR (delegasi ke host)
     ============================================================ */
  function refreshImage(id) {
    var input = document.getElementById(id);
    var prev = document.getElementById(id + "_prev");
    if (!input || !prev) return;
    var v = String(input.value).trim();
    if (v && host.imagePreviewUrl) { prev.src = host.imagePreviewUrl(v); prev.classList.remove("hidden"); }
    else { prev.removeAttribute("src"); prev.classList.add("hidden"); }
  }
  function setImage(id, path) {
    var input = document.getElementById(id);
    if (!input) return;
    input.value = host.normalizeImagePath ? host.normalizeImagePath(path) : path;
    refreshImage(id);
  }
  function pickImage(id) {
    if (host.openMediaPicker) host.openMediaPicker(function (path) { setImage(id, path); });
  }
  function uploadImage(id) {
    if (host.uploadImage) host.uploadImage(function (path) { setImage(id, path); });
  }

  /* ---------- Sinkronkan color picker ↔ hex teks ---------- */
  function bindColorSync(scope) {
    if (!scope) return;
    var pickers = scope.querySelectorAll('input[type="color"]');
    Array.prototype.forEach.call(pickers, function (picker) {
      var hex = scope.querySelector('.cz-color-hex[data-for="' + picker.id + '"]');
      if (!hex || picker.dataset.bound) return;
      picker.dataset.bound = "1";
      picker.addEventListener("input", function () { hex.value = picker.value; });
      hex.addEventListener("input", function () {
        var v = hex.value.trim();
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) picker.value = v;
      });
    });
  }

  /* ============================================================
     COLLECT FINAL — kembalikan { options, content }
     ============================================================ */
  function collect() {
    collectActive();
    // Salin bersih
    return {
      options: JSON.parse(JSON.stringify(data.options || {})),
      content: JSON.parse(JSON.stringify(data.content || {})),
    };
  }

  /* ---------- API publik ---------- */
  return {
    init: init,
    load: load,
    go: go,
    add: add,
    remove: remove,
    move: move,
    rowType: rowType,
    refreshImage: refreshImage,
    pickImage: pickImage,
    uploadImage: uploadImage,
    collect: collect,
    hasAnything: hasAnything,
  };
})();
