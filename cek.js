import { createClient } from '@supabase/supabase-js'

// Mengambil kunci rahasia dari Environment Variables yang sudah diisi di Vercel
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // Pengaturan keamanan CORS agar Frontend bisa mengakses API ini
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Tolak jika ada yang mengakses selain menggunakan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  // PERUBAHAN 1: Menerima input tanggal_lahir dari frontend
  const { nisn, tanggal_lahir } = req.body;

  // PERUBAHAN 2: Validasi ganda apakah NISN atau Tanggal Lahir ada yang kosong
  if (!nisn || !tanggal_lahir) {
    return res.status(400).json({ error: 'NISN dan Tanggal Lahir harus diisi' });
  }

  try {
    // PERUBAHAN 3: Mencari data yang cocok dengan NISN DAN Tanggal Lahir sekaligus
    const { data, error } = await supabase
      .from('DataKelulusan2026')
      .select('nisn, nama, tempat_lahir, tanggal_lahir, nama_ortu, status')
      .eq('nisn', nisn.trim())
      .eq('tanggal_lahir', tanggal_lahir.trim()) // Memastikan tanggal lahir di database sama dengan input siswa
      .maybeSingle();

    // Jika terjadi eror internal pada sambungan Supabase
    if (error) {
      return res.status(500).json({ error: 'Gagal terhubung ke database sekolah.' });
    }

    // PERUBAHAN 4: Pesan disesuaikan jika salah satu atau kedua data tidak cocok
    if (!data) {
      return res.status(404).json({ error: 'Data tidak ditemukan. Pastikan NISN dan Tanggal Lahir Anda sudah benar.' });
    }

    // Jika data ditemukan, kirimkan hasilnya ke frontend
    return res.status(200).json(data);

  } catch (err) {
    // Penanganan eror tak terduga lainnya
    return res.status(500).json({ error: 'Terjadi kesalahan sistem internal.' });
  }
}