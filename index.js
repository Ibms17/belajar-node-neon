require('dotenv').config();
const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

// 🟢 1. TAMBAHKAN DUA BARIS INI: Mengimpor Driver Postgres dan Adapter Resmi Prisma v7
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;

// 🟢 2. UBAH BAGIAN INI: Menghubungkan Prisma ke Neon menggunakan Driver Adapter agar aman
const databasePool = new Pool({ connectionString: "postgresql://neondb_owner:npg_b6Y0aNTvmRsx@ep-polished-dream-azeu5ljm.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"});
const databaseAdapter = new PrismaPg(databasePool);
const prisma = new PrismaClient({ adapter: databaseAdapter }); 

app.use(express.json());

// 🟡 ATURAN VALIDASI ZOD (Tetap Sama)
const UserSchema = z.object({
  nama: z.string().min(3, { message: "Nama minimal harus 3 karakter!" }),
  email: z.string().email({ message: "Format email tidak valid!" }),
  password: z.string().min(6, { message: "Password minimal harus 6 karakter!" })
});

// 🟢 TAMBAHKAN BARIS INI DI BAGIAN ATAS FILE (Dekat impor express)
const jwt = require('jsonwebtoken');

// KUNCI RAHASIA UNTUK MENYEGEL TIKET (Isi bebas, contoh: 'KunciRahasiaBackendSaya123')
const JWT_SECRET = 'KunciRahasiaBackendSaya123'; 
const REFRESH_SECRET = 'KunciRahasiaRefreshTokenSaya999'; 

// 🟢 5. ENDPOINT LOGIN: Untuk mencetak Tiket Digital (Token JWT)
// 🟢 GANTI BLOK LOGIN LAMA ANDA DENGAN LOGIKA ASLI INI:
// 🟢 GANTI BLOK LOGIN LAMA ANDA DENGAN LOGIKA ASLI DUAL-TOKEN INI:
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cari pengguna di database
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return res.status(401).json({ pesan: 'Email atau password salah!' });
    }

    // 2. Validasi password terenkripsi
    const passwordCocok = await bcrypt.compare(password, user.password);

    if (!passwordCocok) {
      return res.status(401).json({ pesan: 'Email atau password salah!' });
    }

    // 3. CETAK DUAL-TOKEN SEKALIGUS (ACCESS TOKEN & REFRESH TOKEN)
    const accessToken = jwt.sign(
      { id: user.id, nama: user.nama, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '15m' } // Berlaku sebentar (15 Menit)
    );

    const refreshToken = jwt.sign(
      { id: user.id }, 
      REFRESH_SECRET, 
      { expiresIn: '7d' } // Berlaku lama (7 Hari)
    );

    // 4. SIMPAN REFRESH TOKEN KE DATABASE CLOUD NEON
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken }
    });

    // 5. Kirim kedua token tersebut ke Postman
    res.status(200).json({
      pesan: 'Login sukses bertenaga Dual-Token!',
      accessToken: accessToken,
      refreshToken: refreshToken
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 6. ENDPOINT REFRESH TOKEN: Tempat menukar Refresh Token dengan Access Token Baru
app.post('/token', async (req, res) => {
  const { refreshToken } = req.body; // Mengambil refresh token yang dikirim dari Postman

  // Jika Postman tidak mengirimkan refresh token sama sekali
  if (!refreshToken) {
    return res.status(401).json({ pesan: 'Akses ditolak! Refresh token wajib dilampirkan.' });
  }

  try {
    // 1. Cari di database cloud Neon, apakah ada user yang memiliki refresh token ini
    const user = await prisma.user.findFirst({
      where: { refreshToken: refreshToken }
    });

    // 2. Jika token tersebut palsu atau tidak terdaftar di database manapun
    if (!user) {
      return res.status(403).json({ pesan: 'Refresh token Anda tidak valid atau sudah dihapus!' });
    }

    // 3. Verifikasi apakah token tersebut sudah kedaluwarsa secara sistem waktu JWT
    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ pesan: 'Refresh token Anda sudah kedaluwarsa, silakan login ulang!' });
      }

      // 4. Jika lolos semua sensor, cetak ACCESS TOKEN BARU yang segar!
      const accessTokenBaru = jwt.sign(
        { id: user.id, nama: user.nama, email: user.email },
        JWT_SECRET,
        { expiresIn: '15m' } // Berlaku 15 menit lagi
      );

      res.status(200).json({
        pesan: 'Access Token baru berhasil dicetak otomatis!',
        accessToken: accessTokenBaru
      });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 FUNGSI TAMENG (MIDDLEWARE) UNTUK MEMERIKSA TIKET JWT
const verifikasiTiket = (req, res, next) => {
  // Ambil token dari header 'Authorization' di Postman
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Mengambil teks setelah kata 'Bearer '

  if (!token) {
    return res.status(403).json({ pesan: 'Akses ditolak! Anda tidak membawa tiket digital (Token JWT).' });
  }

  // Periksa apakah tiketnya asli atau palsu/kedaluwarsa
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ pesan: 'Tiket digital Anda palsu atau sudah kedaluwarsa!' });
    }
    req.user = decoded; // Simpan data user yang login ke dalam sistem
    next(); // Lolos sensor! Silakan lanjut ke fungsi utama
  });
};

// 🟡 1. ENDPOINT GET (Tetap Sama)
app.get('/users', async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();
    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟡 2. ENDPOINT POST (Tetap Sama)
app.post('/users', async (req, res) => {
  try {
    const dataTervalidasi = UserSchema.parse(req.body);
    const { nama, email, password } = dataTervalidasi;

    // 🟢 PROSES HASHING: Mengacak password sebanyak 10 putaran salt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Simpan ke database Neon menggunakan password yang sudah diacak
    const userBaru = await prisma.user.create({
      data: { 
        nama, 
        email, 
        password: hashedPassword // 👈 Simpan yang sudah dihash!
      }
    });

    res.status(201).json({
      pesan: 'Pengguna berhasil terdaftar dengan aman!',
      data: { id: userBaru.id, nama: userBaru.nama, email: userBaru.email } // Sembunyikan password dari respons demi keamanan
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        pesan: 'Data ditolak oleh sensor Zod!',
        detail_kesalahan: error.issues.map(err => err.message)
      });
    }
    res.status(500).json({ error: error.message });
  }
});


// 🟡 3. ENDPOINT PUT (Tetap Sama)
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, email } = req.body;
  try {
    const userDiupdate = await prisma.user.update({
      where: { id: Number(id) },
      data: { nama, email }
    });
    res.status(200).json({ 
      pesan: 'Data berhasil diperbarui menggunakan Prisma!', 
      data: userDiupdate 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟡 4. ENDPOINT DELETE (Tetap Sama)
app.delete('/users/:id', verifikasiTiket, async (req, res) => {
  const { id } = req.params;
  try {
    const userDihapus = await prisma.user.delete({
      where: { id: Number(id) }
    });
    res.status(200).json({ 
      pesan: 'Pengguna berhasil dihapus menggunakan Prisma!', 
      data: userDihapus 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berbasis PRISMA v7 berjalan di http://localhost:${PORT}`);
});