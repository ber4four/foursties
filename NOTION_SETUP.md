# 📚 Panduan Template Database Notion - Kremes_Pedia

Dokumen ini menjelaskan struktur template database Notion yang digunakan oleh website **Kremes_Pedia** sebagai Content Management System (CMS) artikel blog MPASI & balita.

---

## ⚡ Cara Cepat: Otomatisasi via Script

Kami telah menyediakan skrip otomatis untuk membuat database lengkap beserta 3 artikel contoh langsung ke Notion Anda:

```bash
npm run setup:notion
```

Skrip akan menanyakan:
1. **NOTION_TOKEN**: Token Secret dari [Notion Integrations](https://www.notion.so/my-integrations)
2. **Page ID / URL Page**: Link halaman Notion tempat Anda ingin meletakkan database.

*Setelah selesai, skrip otomatis memperbarui file `.env` dengan `NOTION_DATABASE_ID`.*

---

## 🛠️ Cara Manual: Membuat Database di Notion UI

Jika Anda ingin membuat database secara manual di Notion:

### 1. Buat Halaman & Database Baru
1. Buka aplikasi atau situs [Notion](https://www.notion.so/).
2. Buat halaman baru, beri judul misalnya **"Kremes_Pedia Blog"**.
3. Di dalam halaman tersebut, ketik `/database table` lalu pilih **Table view -> New database**.

### 2. Atur Kolom (Properties) Database

Pastikan nama kolom dan tipe datanya **persis** seperti tabel di bawah ini (case-sensitive):

| Nama Kolom | Tipe Data Notion | Keterangan & Nilai Opsi |
| :--- | :--- | :--- |
| **Title** | `Title` *(Bawaan)* | Judul artikel blog |
| **Status** | `Select` | Status publikasi. Opsi: <br>• `Published` *(Warna Hijau - Artikel hanya tampil jika status ini)* <br>• `Draft` *(Kuning)* <br>• `Archived` *(Abu-abu)* |
| **Date** | `Date` | Tanggal rilis artikel (digunakan untuk pengurutan tanggal terbaru) |
| **Slug** | `Text` *(Rich text)* | Kustom URL slug artikel (contoh: `solusi-anak-lahap-makan`). Jika kosong, otomatis digenerate dari Title |
| **Excerpt** | `Text` *(Rich text)* | Ringkasan singkat 1-2 kalimat untuk kartu blog dan deskripsi SEO |
| **Tags** | `Multi-select` | Kategori/topik artikel. Rekomendasi opsi: <br>• `Solusi Anti-GTM` <br>• `Inovasi Tekstur & Sensori MPASI` <br>• `Resep MPASI Sehat` <br>• `Nutrisi Balita` <br>• `Tips Ibu Bekerja` |
| **Cover** | `Files & media` | Upload gambar sampul artikel atau tempelkan link URL gambar external (Unsplash/CDN). Alternatif: bisa pakai *Add cover* bawaan Notion |

---

### 3. Buat Integrasi Notion & Hubungkan ke Database

1. Buka **[https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)**.
2. Klik **+ New integration**.
3. Beri nama (contoh: `KremesPedia-CMS`), pilih Workspace Anda, lalu klik **Submit**.
4. Salin **Internal Integration Secret** (berawalan `secret_...` atau `ntn_...`).
5. Kembali ke Halaman / Database Notion Anda:
   - Klik tombol **titik tiga (...)** di pojok kanan atas halaman.
   - Gulir ke bawah, pilih **Connect to** (atau *Add connections*).
   - Cari dan pilih nama integrasi yang baru saja dibuat (`KremesPedia-CMS`).
   - Berikan izin konfirmasi akses.

---

### 4. Ambil Database ID

Buka database Notion dalam mode Full Page atau salin link database:
- Link database biasanya berbentuk:
  `https://www.notion.so/{workspace_name}/{DATABASE_ID}?v=...`
- Bagian **32 karakter alfanumerik** sebelum tanda `?v=` adalah **Database ID**.
  Contoh: jika link adalah `https://www.notion.so/myworkspace/a1b2c3d4e5f678901234567890abcdef?v=...`, maka Database ID adalah `a1b2c3d4e5f678901234567890abcdef`.

---

### 5. Masukkan ke File `.env`

Buka file [`.env`](file:///c:/Users/Lenovo/Downloads/foursties/.env) di project Anda dan masukkan nilainya:

```env
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Setelah itu, muat ulang server dev:
```bash
npm run dev
```

Website akan langsung mengambil artikel-artikel Notion yang bertatus **`Published`** secara real-time!
