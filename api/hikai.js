export default async function handler(req, res) {
  // Pengaturan Header CORS untuk Keamanan Lintas Domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Tangani preflight request dari peramban (browser)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Mengambil URL Google Apps Script dari Environment Variables di Dashboard Vercel Anda
  const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;

  if (!GAS_WEB_APP_URL) {
    return res.status(500).json({ 
      status: "error", 
      message: "Konfigurasi Server Error: GAS_WEB_APP_URL belum diatur di Environment Variables Vercel." 
    });
  }

  const { query } = req;
  const action = query.action;

  if (!action) {
    return res.status(400).json({ status: "error", message: "Aksi tidak boleh kosong." });
  }

  // Bungkus query parameter agar diteruskan ke Google Apps Script
  const queryString = new URLSearchParams(query).toString();
  const targetUrl = `${GAS_WEB_APP_URL}?${queryString}`;

  try {
    let response;
    
    if (req.method === 'POST') {
      // Teruskan payload JSON (seperti detail produk/inquiry baru) ke Google Sheets
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
    } else {
      // Ambil data untuk GET request
      response = await fetch(targetUrl, { method: 'GET' });
    }

    if (!response.ok) {
      throw new Error(`Koneksi ke Google Apps Script gagal dengan status HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ 
      status: "error", 
      message: `Terjadi kegagalan komunikasi API: ${error.message}` 
    });
  }
}
