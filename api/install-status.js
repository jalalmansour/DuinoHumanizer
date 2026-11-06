module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    is_installed: true,
    is_installing: false,
    step: "complete",
    message: "Duino Humanizer Cloud Ready"
  });
};
