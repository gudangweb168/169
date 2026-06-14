# Tema Kuliner — GitCMS

Tema pemesanan makanan/minuman ala **GoFood/GrabFood**: mobile-first, dengan **keranjang belanja** dan **checkout via WhatsApp**. Setiap menu adalah **artikel biasa** yang diberi field **`harga`** di frontmatter — tidak ada tipe konten khusus, jadi Anda mengelolanya lewat editor artikel yang sudah ada.

Tema ini mengikuti kontrak emas GitCMS: **inti menyediakan data, tema yang merender**. SEO/JSON-LD tetap ditangani inti (satu `@graph`).

---

## 1. Mengaktifkan tema

Panel admin → menu **Tema** → kartu **Kuliner** → **Aktifkan**. Lalu klik **Sesuaikan →** untuk mengatur isi beranda.

## 2. Menambah menu (produk)

Buat artikel seperti biasa, tambahkan field **`harga`** pada frontmatter. Contoh:

```markdown
---
title: "Nasi Goreng Spesial"
slug: nasi-goreng-spesial
date: 2026-06-10
status: published
category: "Makanan Berat"
author: "Dapur Kuliner"
tags: ["nasi", "favorit"]
harga: 25000
featured_image: "https://contoh.com/nasi-goreng.jpg"
excerpt: "Nasi goreng kampung dengan telur, ayam suwir, dan kerupuk."
---

Deskripsi lengkap menu di sini (mendukung Markdown).
```

Catatan field:
- **`harga`** — angka, mis. `25000` (boleh juga `"Rp 25.000"` / `"25,000"`; tema mengambil digitnya). Bila kosong, harga tidak ditampilkan.
- **`category`** — dipakai sebagai kategori menu sekaligus untuk filter kategori di beranda.
- **`featured_image`** — foto menu. Boleh URL eksternal (http/https) maupun path media lokal — keduanya ditangani otomatis.
- **`tersedia`** *(opsional)* — set `false` atau `"habis"` untuk menandai menu **Habis** (tombol tambah dinonaktifkan). Bila tidak ditulis, menu dianggap tersedia.

## 3. Pengaturan pemesanan (WhatsApp & nomor meja)

Di menu **Sesuaikan → Pemesanan WhatsApp**:
- **`Nomor WhatsApp tujuan pesanan`** — wajib. Format internasional tanpa `+`, mis. `628123456789`. Tanpa ini, tombol checkout tidak bisa mengirim pesan.
- **Nama toko**, **salam pembuka**, **simbol mata uang** (default `Rp`), dan **catatan** akhir pesan.

**Pemesanan per meja (makan di tempat):** buka situs dengan parameter `?meja=NOMOR`, mis.:

```
https://situsanda.com/?meja=12
```

Tema akan menyimpan nomor meja, menampilkannya sebagai badge di header, dan menyertakannya pada pesan WhatsApp saat checkout. Praktik umum: cetak **QR code** berisi URL `?meja=` itu untuk tiap meja. Pelanggan dapat menghapus nomor meja dari laci keranjang.

## 4. Opsi tampilan

Di menu **Sesuaikan → Tampilan**:
- **Warna Aksen** (`accent`) — warna utama (default oranye-tomat `#f24a23`).
- **Warna Aksi / WhatsApp** (`accent2`) — warna tombol pesan/WhatsApp & badge meja (default hijau `#0d9f4f`).
- **Font Isi** (`fontBody`) — `Plus Jakarta Sans` (default), `Inter`, atau `Poppins`.

## 5. Bagian beranda

Semua dapat diatur lewat **Sesuaikan**: **Hero Slider**, **Kotak Pencarian**, **Kategori Berfoto**, **Daftar Menu** (tampil sebagai list di mobile, grid di desktop), **Lokasi & Kontak** (embed Google Maps), dan **Ajakan/CTA**. Pencarian dan filter kategori berjalan langsung di sisi pengunjung.

---

## Lampiran — Contoh isi `themeData.kuliner`

Biasanya Anda cukup mengisi lewat menu **Sesuaikan**. Bila ingin menyetel manual, berikut contoh blok `themeData.kuliner` di `config.json`:

```json
{
  "themeData": {
    "kuliner": {
      "options": {},
      "content": {
        "hero": {
          "enabled": true,
          "autoplay": true,
          "interval": 5,
          "slides": [
            {
              "image": "https://contoh.com/hero-1.jpg",
              "title": "Lapar? Pesan Langsung dari Sini",
              "subtitle": "Menu favorit diantar hangat, atau makan di tempat lewat nomor meja.",
              "buttonText": "Lihat Menu",
              "buttonUrl": "#menu"
            }
          ]
        },
        "search": { "enabled": true, "placeholder": "Cari menu favoritmu…" },
        "categories": {
          "enabled": true,
          "eyebrow": "Mau makan apa hari ini?",
          "title": "Pilih Kategori",
          "items": [
            { "name": "Makanan Berat", "image": "https://contoh.com/kat-berat.jpg", "filter": "" },
            { "name": "Minuman", "image": "https://contoh.com/kat-minuman.jpg", "filter": "" }
          ]
        },
        "products": {
          "enabled": true,
          "eyebrow": "Menu Kami",
          "title": "Daftar Menu",
          "intro": "Pilih menu favoritmu, masukkan ke keranjang, lalu pesan lewat WhatsApp.",
          "source": "terbaru",
          "category": "",
          "limit": 0,
          "showPrice": true,
          "showCategoryFilter": true
        },
        "location": {
          "enabled": true,
          "title": "Lokasi & Kontak",
          "address": "Jl. Contoh Rasa No. 12, Tangerang",
          "mapsEmbed": "",
          "mapsLink": "https://maps.google.com/?q=Tangerang",
          "phone": "021-1234567",
          "hours": "Setiap hari, 10.00 – 22.00 WIB"
        },
        "order": {
          "whatsapp": "628123456789",
          "storeName": "Dapur Kuliner",
          "greeting": "Halo, saya ingin memesan:",
          "currency": "Rp",
          "note": "Terima kasih sudah memesan 🙏"
        },
        "cta": {
          "enabled": true,
          "title": "Masih lapar? Yuk pesan sekarang!",
          "text": "Keranjang menunggu — checkout cepat lewat WhatsApp.",
          "buttonText": "Pesan Sekarang",
          "buttonUrl": "#menu"
        }
      }
    }
  }
}
```

— GudangWEB
