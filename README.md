<<<<<<< HEAD
# BeOne-RT
=======
# Sistem Manajemen RT Elite (Beon Case Study)

Aplikasi manajemen administrasi RT untuk mengelola data warga, hunian rumah, dan iuran bulanan (Satpam & Kebersihan).

## Tech Stack
- **Backend**: Laravel 11 (PHP 8.2+)
- **Frontend**: React + Vite (Tailwind CSS)
- **Database**: MySQL

## Persyaratan
1. PHP >= 8.2
2. Composer
3. Node.js & npm
4. MySQL Server

## Langkah Instalasi

### 1. Persiapan Database
Buat database baru di MySQL dengan nama `db_beone_rt`.

### 2. Setup Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```
Edit file `.env` dan sesuaikan kredensial MySQL Anda:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_beone_rt
DB_USERNAME=root
DB_PASSWORD=
```
Jalankan migrasi dan seeder data dummy:
```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## Fitur Utama
- **Dashboard Premium**: Ringkasan statistik dan grafik keuangan.
- **Kelola Warga**: CRUD data warga lengkap dengan unggah foto KTP.
- **Kelola Rumah**: Monitoring status hunian (Kosong/Terhuni) dan riwayat penghuni.
- **Iuran Bulanan**: Pencatatan iuran Satpam (100k) dan Kebersihan (15k).
- **Laporan Keuangan**: Rekapitulasi pemasukan dan pengeluaran RT.


