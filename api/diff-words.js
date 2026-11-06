module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  const { original_text, humanized_text } = req.body || {};

  const origWords = (original_text || "").split(/(\s+)/).filter(Boolean);
  const humWords = (humanized_text || "").split(/(\s+)/).filter(Boolean);

  const humSet = new Set(humWords.map(w => w.trim().toLowerCase()).filter(Boolean));
  const origSet = new Set(origWords.map(w => w.trim().toLowerCase()).filter(Boolean));

  const orig_spans = origWords.map(w => {
    const clean = w.trim().toLowerCase();
    const isSpace = /^\s+$/.test(w);
    return {
      text: w,
      changed: !isSpace && clean.length > 1 && !humSet.has(clean)
    };
  });

  const hum_spans = humWords.map(w => {
    const clean = w.trim().toLowerCase();
    const isSpace = /^\s+$/.test(w);
    return {
      text: w,
      changed: !isSpace && clean.length > 1 && !origSet.has(clean)
    };
  });

  return res.status(200).json({ orig_spans, hum_spans });
};
