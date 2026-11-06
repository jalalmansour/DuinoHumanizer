// =========================================================================
// Duino Humanizer • Universal Document Parser & Layout Preservation Engine
// 100% Free Serverless Ingestion & Layout Preservation for Vercel
// Full Feature Parity with paraphraser/scripts/document_parser.py
// Supports: DOCX, PDF, RTF, HTML, Markdown, LaTeX, TXT, CSV, JSON
// =========================================================================

const zlib = require('zlib');
const path = require('path');

// =========================================================================
// 1. TEXT NORMALIZER & SANITIZER (Parity with text_normalizer.py)
// =========================================================================
const INVISIBLE_CHARS_REGEX = /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const CURLY_DOUBLE_QUOTES = /[\u201C\u201D\u201E\u201F\u00AB\u00BB\u301D\u301E]/g;
const CURLY_SINGLE_QUOTES = /[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g;
const DASHES_REGEX = /[\u2014\u2013\u2012\u2015\u2212\uFE58\uFE63]/g;
const ELLIPSIS_REGEX = /[\u2026]/g;
const EMOJI_REGEX = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2194-\u2199])/g;

function sanitizeText(rawText, autoFormatHeadings = true, breakLongParas = true) {
  if (!rawText) return "";

  // 1. Normalize line endings
  let cleaned = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Remove invisible characters
  cleaned = cleaned.replace(INVISIBLE_CHARS_REGEX, "");

  // 3. Normalize non-breaking spaces and exotic whitespace
  cleaned = cleaned.replace(/[\u00A0\u202F\u2007\u2009\u200A\u1680\u2000-\u2006\u2008\u3000]/g, " ");

  // 4. Straight quotes
  cleaned = cleaned.replace(CURLY_DOUBLE_QUOTES, '"');
  cleaned = cleaned.replace(CURLY_SINGLE_QUOTES, "'");

  // 5. Dashes & Ellipsis
  cleaned = cleaned.replace(DASHES_REGEX, "-");
  cleaned = cleaned.replace(ELLIPSIS_REGEX, "...");

  // 6. Emojis
  cleaned = cleaned.replace(EMOJI_REGEX, "");

  // 7. Collapse spaces per line
  const lines = cleaned.split("\n");
  const normalizedLines = lines.map(l => l.replace(/[ \t]+/g, " ").trim());
  cleaned = normalizedLines.join("\n");

  // 8. Limit consecutive newlines to at most 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  // 9. Heading detection & paragraph balancing
  if (autoFormatHeadings || breakLongParas) {
    cleaned = balanceHeadingsAndParagraphs(cleaned, autoFormatHeadings, breakLongParas);
  }

  return cleaned;
}

function balanceHeadingsAndParagraphs(text, formatHeadings = true, breakLongParas = true) {
  const paragraphs = text.split("\n\n");
  const processed = [];

  const headingPattern = /^(?:#{1,6}\s+|[IVXLCDM]+\.\s+|[0-9]+\.[0-9]*\s+|Section\s+[0-9]+:?|Chapter\s+[0-9]+:?|Abstract|Introduction|Methodology|Results|Discussion|Conclusion|References|Bibliography)/i;

  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;

    const lines = p.split("\n");
    const words = p.split(/\s+/).filter(Boolean);

    // Standalone heading
    if (lines.length === 1 && words.length <= 12 && !/[.,;:]$/.test(p)) {
      if (headingPattern.test(p) || p === p.toUpperCase() && p.length > 3) {
        if (formatHeadings) {
          const pHead = p.replace(/^#+\s*/, '').trim();
          processed.push(`## ${pHead}`);
        } else {
          processed.push(p);
        }
        continue;
      }
    }

    // Break up long paragraphs (> 120 words)
    if (breakLongParas && words.length > 120) {
      const sentences = p.split(/(?<=[.!?])\s+/);
      let block = [];
      let count = 0;

      for (const s of sentences) {
        const sWords = s.split(/\s+/).filter(Boolean).length;
        if (count + sWords > 100 && count >= 60) {
          processed.push(block.join(" ").trim());
          block = [s];
          count = sWords;
        } else {
          block.push(s);
          count += sWords;
        }
      }
      if (block.length > 0) {
        processed.push(block.join(" ").trim());
      }
    } else {
      processed.push(p);
    }
  }

  return processed.join("\n\n");
}

// =========================================================================
// 2. LAYOUT ANALYSIS (Title, Metadata Anchors, Sections, References)
// =========================================================================
function analyzeLayout(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.length) {
    return { has_layout: false, title: "", metadata: [], sections: [], references: [] };
  }

  const title = lines[0];
  const metadata = [];
  const sections = [];
  let references = [];

  let refIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^(?:References|Bibliography|Works Cited|Sources)\b/i.test(lines[i])) {
      refIndex = i;
      break;
    }
  }

  let contentLines = lines;
  if (refIndex !== -1) {
    references = lines.slice(refIndex + 1);
    contentLines = lines.slice(0, refIndex);
  }

  let idx = 1;
  const metaKeys = ["student", "name", "course", "professor", "date", "author", "instructor", "class", "university"];
  while (idx < contentLines.length) {
    const l = contentLines[idx];
    const lLower = l.toLowerCase();
    if (metaKeys.some(k => lLower.includes(k)) && (l.includes(":") || l.includes("-"))) {
      metadata.push(l);
      idx++;
    } else {
      break;
    }
  }

  const bodyLines = contentLines.slice(idx);
  let currentHeading = "Introduction";
  let currentParas = [];

  for (const l of bodyLines) {
    if (/^(?:[IVXLCDM]+\.|\d+\.|\#+)\s+.*$/i.test(l) && l.length < 120) {
      if (currentParas.length > 0) {
        sections.push({ heading: currentHeading, body_paragraphs: currentParas });
        currentParas = [];
      }
      currentHeading = l;
    } else {
      currentParas.push(l);
    }
  }

  if (currentParas.length > 0) {
    sections.push({ heading: currentHeading, body_paragraphs: currentParas });
  }

  const hasLayout = Boolean(metadata.length > 0 || sections.length > 1 || references.length > 0);

  return {
    has_layout: hasLayout,
    title,
    metadata,
    sections,
    references
  };
}

// =========================================================================
// 3. FORMAT EXTRACTORS (DOCX, PDF, RTF, HTML, TXT)
// =========================================================================

// Extract text from DOCX (Unzip word/document.xml)
function extractDocx(buffer) {
  let offset = 0;
  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset++;
      continue;
    }
    const compMethod = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    const dataEnd = dataStart + compSize;

    if (name === 'word/document.xml') {
      const rawData = buffer.slice(dataStart, dataEnd);
      let xml = '';
      if (compMethod === 8) {
        xml = zlib.inflateRawSync(rawData).toString('utf8');
      } else {
        xml = rawData.toString('utf8');
      }

      const paras = [];
      const pMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [xml];
      for (const p of pMatches) {
        const tMatches = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
        if (text.trim()) paras.push(text.trim());
      }
      return paras.join('\n\n');
    }
    offset = dataEnd;
  }

  // Fallback: search for uncompressed XML runs
  const rawStr = buffer.toString('utf8');
  const fallbackMatches = rawStr.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
  if (fallbackMatches && fallbackMatches.length > 0) {
    return fallbackMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
  }
  return "";
}

// Extract text from PDF
function extractPdf(buffer) {
  const str = buffer.toString('latin1');
  const textChunks = [];

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const rawStream = match[1];
    let decoded = rawStream;

    try {
      const streamBuf = Buffer.from(rawStream, 'latin1');
      try {
        decoded = zlib.inflateSync(streamBuf).toString('utf8');
      } catch (e) {
        decoded = zlib.inflateRawSync(streamBuf).toString('utf8');
      }
    } catch (e) {
      decoded = rawStream;
    }

    const btRegex = /BT[\s\S]*?ET/g;
    let btMatch;
    while ((btMatch = btRegex.exec(decoded)) !== null) {
      const block = btMatch[0];
      const tjRegex = /\((.*?)\)\s*(?:Tj|'|")/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        let txt = tjMatch[1].replace(/\\([\\()])/g, '$1');
        textChunks.push(txt);
      }

      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let arrayMatch;
      while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
        const inner = arrayMatch[1];
        const innerStrings = inner.match(/\((.*?)\)/g) || [];
        for (const s of innerStrings) {
          const txt = s.slice(1, -1).replace(/\\([\\()])/g, '$1');
          textChunks.push(txt);
        }
      }
    }
  }

  if (textChunks.length === 0) {
    const simpleTj = /\((.*?)\)\s*Tj/g;
    let sMatch;
    while ((sMatch = simpleTj.exec(str)) !== null) {
      textChunks.push(sMatch[1]);
    }
  }

  // Filter PDF page footers (e.g. 'Page 1 of 4')
  const filtered = textChunks.filter(line => !/^\s*Page\s+\d+(\s+of\s+\d+)?\s*$/i.test(line));
  return filtered.join('\n');
}

// Extract text from RTF
function extractRtf(rtfStr) {
  let text = rtfStr.replace(/\\par[d]?\b/gi, '\n');
  text = text.replace(/\\line\b/gi, '\n');
  text = text.replace(/\\tab\b/gi, '\t');
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  text = text.replace(/{\*?\\[^{}]+}/g, '');
  text = text.replace(/\\[a-zA-Z]+-?[0-9]* ?/g, '');
  text = text.replace(/[{}]/g, '');
  return text.trim();
}

// Extract text from HTML
function extractHtml(htmlStr) {
  let text = htmlStr.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  text = text.replace(/<(h[1-6]|p|div|tr|li|blockquote)\b[^>]*>/gi, '\n\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  return text.trim();
}

// Extract text from LaTeX
function extractLatex(texStr) {
  let text = texStr.replace(/%.*$/gm, '');
  text = text.replace(/\\(section|subsection|chapter)\*?\{([^}]+)\}/gi, '\n\n## $2\n\n');
  text = text.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^}]*)\})?/g, '$1');
  text = text.replace(/[$}{]/g, '');
  return text.trim();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
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
      rawText = extractDocx(buf);
    } else if (ext === "pdf") {
      const buf = is_base64 ? Buffer.from(data, 'base64') : Buffer.from(data);
      rawText = extractPdf(buf);
    } else if (ext === "rtf") {
      const str = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
      rawText = extractRtf(str);
    } else if (ext === "html" || ext === "htm") {
      const str = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
      rawText = extractHtml(str);
    } else if (ext === "tex" || ext === "latex") {
      const str = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
      rawText = extractLatex(str);
    } else {
      rawText = is_base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
    }

    const cleanedText = sanitizeText(rawText);
    const layout = analyzeLayout(cleanedText);

    return res.status(200).json({
      ok: true,
      text: cleanedText,
      doc_type: ext,
      filename: filename,
      metadata: layout.metadata,
      structured_layout: layout,
      char_count: cleanedText.length,
      word_count: cleanedText.trim() ? cleanedText.trim().split(/\s+/).filter(Boolean).length : 0
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
