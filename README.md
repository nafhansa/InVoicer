# InVoicer

Prototype aplikasi invoicing untuk HMIF ITB. Next.js (App Router) + Tailwind, responsif untuk HP dan desktop. Semua data masih hardcoded (seed) dan disimpan di `localStorage` browser, tanpa backend.

## Akun demo

| Peran | Email | Password |
| --- | --- | --- |
| Admin (Bendahara) | admin@hmif.itb.ac.id | admin123 |
| User (Divisi Eksternal) | budi@std.stei.itb.ac.id | user123 |
| User (Divisi Merchandise) | sari@std.stei.itb.ac.id | user123 |

## Fitur

- **Profil tagihan tersimpan**: data pengirim, rekening, NPWP, pajak default, jatuh tempo default, catatan, S&K, dan penanda tangan. Isi sekali, invoice baru otomatis terisi. Bisa punya banyak profil dengan satu default.
- **Klien tersimpan**: pilih klien dari daftar, atau isi klien baru langsung dari form invoice dan simpan otomatis.
- **Katalog item**: produk/jasa yang sering ditagih, tambah ke invoice sekali klik, atau simpan baris invoice ke katalog.
- **Editor invoice**: diskon persen/nominal, PPN, ongkir, preset jatuh tempo (Net 7/14/30/45), pratinjau live, validasi.
- **Alur approval**: invoice dari user diajukan ke bendahara, admin menyetujui (nomor resmi otomatis) atau menolak dengan catatan.
- **Penomoran otomatis**: format `PREFIX/YYYY/MM/NNNN`, bisa diatur admin.
- **Pembayaran**: catat pembayaran penuh atau sebagian, progress bar, status otomatis (Lunas / Dibayar Sebagian / Jatuh Tempo).
- **Kirim & bagikan**: link publik `/p/[id]`, kirim via WhatsApp atau email dengan template pesan, pengingat pembayaran.
- **PDF**: cetak / simpan PDF ukuran A4, terbilang Rupiah otomatis, stempel LUNAS / JATUH TEMPO.
- **Invoice berulang & duplikasi**: buat periode berikutnya sekali klik.
- **Dashboard**: total ditagih, diterima, outstanding, jatuh tempo, grafik pemasukan 6 bulan, antrian approval.
- **Riwayat aktivitas** per invoice, ekspor CSV, pencarian dan filter status.
- **Admin**: kelola pengguna (tambah, peran, nonaktifkan, reset password), pengaturan organisasi, reset data demo.

> Catatan prototype: data tersimpan per browser, jadi link publik hanya terbuka di browser yang sama. Untuk produksi, ganti `src/lib/store.tsx` dengan database dan auth sungguhan.

## Jalankan lokal

```bash
npm install
npm run dev
```

## Deploy

Import repo ini di Vercel, framework otomatis terdeteksi sebagai Next.js. Tidak perlu environment variable.
