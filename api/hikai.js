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
      message: "Konfigurasi database Belum Lengkap"
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
        headers: { 'Content-Type': 'application/json' },
        redirect: 'manual' // MANDATORI: Tangani pengalihan secara manual agar payload POST tidak hilang/berubah menjadi GET
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

    let response = await fetch(url.toString(), options);
    
    // Tangani manual redirect 302/301/307 dari Google Apps Script secara aman
    if (response.status === 302 || response.status === 301 || response.status === 307) {
        const redirectUrl = response.headers.get('location');
        if (redirectUrl) {
            // Google mengalihkan respon ke URL GET khusus untuk membaca output JSON hasil eksekusi POST
            response = await fetch(redirectUrl, {
                method: 'GET'
            });
        }
    }
    
    const responseText = await response.text();

    try {
        const data = JSON.parse(responseText);
        return res.status(200).json(data);
    } catch (parseError) {
        console.error("Bukan JSON, Google merespon dengan:", responseText.substring(0, 150));
        
        if (responseText.includes('<html') || responseText.includes('google')) {
             return res.status(500).json({
                status: "error",
                message: "Akses Ditolak oleh Google. Pastikan Apps Script diatur ke 'Anyone'.",
                detail: "Google meminta login ulang / merespon dengan HTML."
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Format respons dari cloud tidak valid.",
            detail: responseText.substring(0, 100)
        });
    }

  } catch (error) {
    console.error("Vercel Proxy Error Utama:", error);
    return res.status(500).json({ 
        status: "error", 
        message: `gagal menghubungi jembatan database cloud: ${error.message}` 
    });
  }
}
