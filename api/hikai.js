/* =======================================================
   HIKAI VVIP SERVERLESS WEBHOOK PROXY (api/hikai.js)
   ======================================================= */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!targetWebhookUrl) {
    return res.status(500).json({
      status: "error",
      message: "Konfigurasi Belum Lengkap pada Environment Variables Anda."
    });
  }

  try {
    const url = new URL(targetWebhookUrl);
    
    // Secara otomatis meneruskan semua parameter (seperti action, password)
    for (const key in req.query) {
        url.searchParams.append(key, req.query[key]);
    }
    
    const options = {
        method: req.method,
        // text/plain wajib digunakan agar Google tidak menolak dengan CORS error
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
    
    // BACA SEBAGAI TEXT DULU: Mencegah crash jika Google membalas dengan halaman HTML (bukan JSON)
    const responseText = await response.text();

    try {
        // Coba jadikan JSON
        const data = JSON.parse(responseText);
        return res.status(200).json(data);
    } catch (parseError) {
        // JIKA MASUK KESINI: Google membalas dengan HTML/Text (Biasanya halaman login Google)
        console.error("Bukan JSON, Google merespon dengan:", responseText.substring(0, 150));
        
        if (responseText.includes('<html') || responseText.includes('google')) {
             return res.status(500).json({
                status: "error",
                message: "Akses Ditolak",
                detail: "Google meminta login ulang / merespon dengan HTML."
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Format respons dari Google Apps Script tidak valid.",
            detail: responseText.substring(0, 100)
        });
    }

  } catch (error) {
    console.error("Vercel Proxy Error Utama:", error);
    return res.status(500).json({ 
        status: "error", 
        message: `gagal menghubungi server: ${error.message}` 
    });
  }
}
