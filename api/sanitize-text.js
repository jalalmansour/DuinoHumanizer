module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  const { text } = req.body || {};

  const cleaned = (text || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  return res.status(200).json({ sanitized_text: cleaned });
};
