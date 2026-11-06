module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  const { text, format, filename } = req.body || {};

  const mime = format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
               format === "pdf" ? "application/pdf" : "text/plain;charset=utf-8";

  const b64 = Buffer.from(text || "", "utf-8").toString("base64");
  const dataUrl = `data:${mime};base64,${b64}`;

  return res.status(200).json({
    success: true,
    filename: filename || `Humanized_Deliverable_${Date.now()}.${format || 'txt'}`,
    download_url: dataUrl
  });
};
