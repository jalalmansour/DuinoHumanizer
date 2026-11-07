module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'online',
    version: '2.5.0',
    engine: 'Duino Humanizer Live ZeroGPT & SuperHumanizer Verification Engine',
    runtime: 'Node.js (Serverless & Desktop)',
    quality_gate: 'ZeroGPT < 7.0% AI | > 93.0% Human',
    endpoints: [
      '/api/status',
      '/api/humanize-text',
      '/api/parse-document',
      '/api/diff-words',
      '/api/export-text',
      '/api/sanitize-text',
      '/api/queue',
      '/api/install-status'
    ]
  });
};
