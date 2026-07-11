export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;

  if (!GAS_WEB_APP_URL) {
    return res.status(500).json({ 
      status: "error", 
      message: "GAS_WEB_APP_URL belum diatur di Environment Variables Vercel." 
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
      // Perbaikan Kritis: Pastikan body diubah menjadi string JSON murni yang valid agar Google Apps Script tidak melempar HTTP 500
      const bodyPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: bodyPayload,
        redirect: 'follow' // Memaksa Vercel untuk mengikuti pengalihan (302) dari server Google secara otomatis
      });
    } else {
      response = await fetch(targetUrl, { 
        method: 'GET',
        redirect: 'follow'
      });
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // Jika Google mengembalikan format teks biasa, bungkus ke JSON agar front-end tidak crash
      data = { status: "success", message: responseText };
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Connection Error:", error);
    return res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
}
