/* =======================================================
   HIKAI VVIP SERVERLESS WEBHOOK PROXY (api/hikai.js)
   ======================================================= */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-target-url');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Membaca URL tujuan dinamis dari header 'x-target-url' (input admin) atau fallback ke Env Variable
  const targetWebhookUrl = req.headers['x-target-url'] || process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  
  if (!targetWebhookUrl) {
    return res.status(500).json({
      status: "error",
      message: "Konfigurasi Belum Lengkap"
    });
  }

  try {
    const url = new URL(targetWebhookUrl);
    
    // Meneruskan seluruh parameter query (seperti action, password)
    for (const key in req.query) {
        url.searchParams.append(key, req.query[key]);
    }
    
    const options = {
        method: req.method,
        // Menggunakan text/plain agar tidak memicu CORS Preflight yang ketat pada server Google
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow'
    };

    if (req.method === 'POST') {
        let bodyPayload;
        try {
            bodyPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            bodyPayload = req.body;
        }
        options.body = JSON.stringify(bodyPayload);
    }

    const response = await fetch(url.toString(), options);
    const responseText = await response.text();

    try {
        const data = JSON.parse(responseText);
        return res.status(200).json(data);
    } catch (parseError) {
        console.error("Format respons bukan JSON:", responseText.substring(0, 150));
        
        if (responseText.includes('<html') || responseText.includes('google')) {
             return res.status(500).json({
                status: "error",
                message: "Akses Ditolak oleh",
                detail: "Google meminta autentikasi ulang."
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Format respons tidak valid.",
            detail: responseText.substring(0, 100)
        });
    }

  } catch (error) {
    console.error("Vercel Proxy Error Utama:", error);
    return res.status(500).json({ 
        status: "error", 
        message: `Koneksi Terputus: (${error.message})` 
    });
  }
}
