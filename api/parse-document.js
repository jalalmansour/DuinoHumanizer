// =========================================================================
// Duino Humanizer • Universal Document Parser API
// Directly powered by paraphraser/scripts/document_parser.js & text_normalizer.js
// Supports: DOCX, PDF, RTF, HTML, Markdown, LaTeX, TXT
// =========================================================================

const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let UniversalDocumentParser;
    let TextNormalizer;
    try {
      UniversalDocumentParser = require('../lib/document_parser.js').UniversalDocumentParser;
      TextNormalizer = require('../lib/text_normalizer.js').TextNormalizer;
    } catch (_) {
      try {
        UniversalDocumentParser = require('./document_parser.js').UniversalDocumentParser;
        TextNormalizer = require('./text_normalizer.js').TextNormalizer;
      } catch (reqErr) {
        return res.status(500).json({ error: "Failed to load document parser: " + reqErr.message, stack: reqErr.stack });
      }
    }

    const {
      filename = "document.txt",
      data = "",
      format = "",
      is_base64 = false
    } = req.body || {};

    if (!data) {
      return res.status(400).json({ error: "Missing document payload" });
    }

    const ext = (format || path.extname(filename).toLowerCase().replace(/^\./, '') || "txt").toLowerCase();
    let rawText = "";

    if (ext === "docx" || ext === "doc") {
      const buf = is_base64 ? Buffer.from(data, 'base64') : Buffer.from(data);
      rawText = UniversalDocumentParser.parseDocxBuffer(buf);
    } else if (ext === "pdf") {
      const buf = is_base64 ? Buffer.from(data, 'base64') : Buffer.from(data);
      rawText = UniversalDocumentParser.parsePdfBuffer(buf);
    } else if (ext === "rtf") {
      const str = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
      rawText = UniversalDocumentParser.parseRtf(str);
    } else if (ext === "html" || ext === "htm") {
      const str = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
      rawText = UniversalDocumentParser.parseHtml(str);
    } else if (ext === "tex" || ext === "latex") {
      const str = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
      rawText = UniversalDocumentParser.parseLatex(str);
    } else {
      rawText = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
    }

    const cleanedText = TextNormalizer.sanitize(rawText);
    const layout = UniversalDocumentParser.analyzeLayout(cleanedText);

    return res.status(200).json({
      ok: true,
      text: cleanedText,
      doc_type: ext,
      filename: filename,
      metadata: layout.metadata || [],
      structured_layout: layout,
      char_count: cleanedText.length,
      word_count: cleanedText.trim() ? cleanedText.trim().split(/\s+/).filter(Boolean).length : 0
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
