Jembatan API (Serverless Proxy):api/hikai.js
```javascript
export default async function handler(req, res) {
  // Pengaturan Header CORS Lintas Domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Mengembalikan respon cepat untuk preflight pre-request browser (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Mengambil URL Google Apps Script yang Anda pasang di Dashboard Vercel Environment Variables
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

  const queryString = new URLSearchParams(query).toString();
  const targetUrl = `${GAS_WEB_APP_URL}?${queryString}`;

  try {
    let response;
    
    if (req.method === 'POST') {
      // Pertahanan ganda untuk membedakan format payload (menghindari double-stringifying)
      const requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
    } else {
      response = await fetch(targetUrl, { method: 'GET' });
    }

    if (!response.ok) {
      throw new Error(`Google Sheets Web App mengembalikan status HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Proxy Connection Error:", error);
    return res.status(500).json({ 
      status: "error", 
      message: `Gagal terhubung ke basis data Cloud Sheets: ${error.message}` 
    });
  }
}
