export default async function handler(req, res) {
    // ⚠️ PENTING: Ganti dengan URL Web App Google Apps Script Anda yang terbaru
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyY1TCpKHfrP7Ow2Fn4DC-uRgiJ4Q6UTHBMBUsbI6hnZ-rfs6eYhGRSq9WbuIgRSoL/exec";

    try {
        const url = new URL(SCRIPT_URL);
        
        // 1. Teruskan Query Parameters (Contoh: action=verifyAdmin & password=6613)
        // Jika bagian ini tidak ada, GAS tidak akan menerima password dan menolak akses.
        for (const key in req.query) {
            url.searchParams.append(key, req.query[key]);
        }

        const options = {
            method: req.method,
            headers: {
                // Jangan gunakan header tambahan lain agar terhindar dari error CORS Google
                "Content-Type": "text/plain;charset=utf-8", 
            },
        };

        // 2. Teruskan Data Payload (Untuk operasi POST seperti update produk)
        if (req.method === 'POST' && req.body) {
            options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        // 3. Panggil Google Apps Script
        const fetchRes = await fetch(url.toString(), options);
        const data = await fetchRes.json();

        // 4. Kembalikan respon ke Frontend Web
        res.status(200).json(data);

    } catch (error) {
        console.error("Vercel Proxy Error:", error);
        res.status(500).json({ status: "error", message: "Gagal terhubung ke Database Cloud (Google Sheets)." });
    }
}
