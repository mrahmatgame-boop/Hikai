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
      message: "Konfigurasi tidak ditemukan pada Environment Variables Anda."
    });
  }

  try {
    const url = new URL(targetWebhookUrl);
    
    for (const key in req.query) {
        url.searchParams.append(key, req.query[key]);
    }
    
    const options = {
        method: req.method,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
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
        console.error("Bukan JSON, Google merespon dengan:", responseText.substring(0, 150));
        
        if (responseText.includes('<html') || responseText.includes('google')) {
             return res.status(500).json({
                status: "error",
                message: "Akses Ditolak oleh Google",
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
        message: `Vercel gagal menghubungi Google Apps Script: ${error.message}` 
    });
  }
}
