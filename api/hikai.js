/* =======================================================
   HIKAI VVIP SERVERLESS WEBHOOK PROXY (api/hikai.js)
   ======================================================= */

export default async function handler(req, res) {
  // Atur Header Keamanan CORS dan Respons JSON
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tangani Preflight Request dari Browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ambil Google Apps Script URL secara rahasia dari Environment Variables Vercel
  const targetWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!targetWebhookUrl) {
    return res.status(500).json({
      status: "error",
      message: "Konfigurasi Vercel Belum Lengkap: GOOGLE_SHEETS_WEBHOOK_URL tidak ditemukan pada Environment Variables Anda."
    });
  }

  try {
    // 1. TANGANI METODE GET (Ambil Data Produk, Inquiries, atau Verifikasi Admin)
    if (req.method === 'GET') {
      const { action, password } = req.query;
      let targetParamsUrl = `${targetWebhookUrl}?action=${action || 'getProducts'}`;
      
      if (password) {
        targetParamsUrl += `&password=${encodeURIComponent(password)}`;
      }

      const response = await fetch(targetParamsUrl);
      if (!response.ok) {
        return res.status(response.status).json({
          status: "error",
          message: `Google Apps Script mengembalikan status HTTP ${response.status}: ${response.statusText}`
        });
      }
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 2. TANGANI METODE POST (Tambah/Edit/Hapus Produk, Tambah Inquiry)
    if (req.method === 'POST') {
      let bodyPayload;
      try {
        bodyPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        bodyPayload = req.body;
      }

      // Gunakan Content-Type 'text/plain' untuk menghindari isu Preflight CORS pada Google Apps Script
      const response = await fetch(targetWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        return res.status(response.status).json({
          status: "error",
          message: `Gagal mengirim data. Google Apps Script merespon dengan status HTTP ${response.status}`
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ status: "error", message: "Metode HTTP Tidak Diizinkan." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: `Gagal menghubungi Google Apps Script: ${error.message}` });
  }
}
