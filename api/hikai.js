export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbz_MOCK_URL_REPLACE_THIS/exec";
  const { query } = req;
  const action = query.action;

  if (!action) {
    return res.status(400).json({ status: "error", message: "Aksi kosong." });
  }

  const queryString = new URLSearchParams(query).toString();
  const targetUrl = `${GAS_WEB_APP_URL}?${queryString}`;

  try {
    let response;
    if (req.method === 'POST') {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
    } else {
      response = await fetch(targetUrl, { method: 'GET' });
    }

    if (!response.ok) {
      throw new Error(`Koneksi Google Apps Script bermasalah.`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
