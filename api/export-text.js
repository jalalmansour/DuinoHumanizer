// =========================================================================
// Duino Humanizer • Universal Multi-Format Document Exporter
// Produces 100% Valid Microsoft Word (.docx), Adobe PDF (.pdf), and .txt
// Zero External Dependencies • Pure Built-in Node.js Engine
// =========================================================================

const zlib = require('zlib');

// CRC32 Table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function calculateCrc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

// Generate valid binary ZIP archive in memory
function buildZipArchive(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  files.forEach(f => {
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf-8');
    const compressed = zlib.deflateRawSync(data);
    const nameBuf = Buffer.from(f.name, 'utf-8');
    const crc = calculateCrc32(data);

    // Local file header (30 bytes + name + compressed data)
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(compressed.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);

    localHeaders.push(Buffer.concat([lh, nameBuf, compressed]));

    // Central directory header (46 bytes + name)
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(compressed.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);

    centralHeaders.push(Buffer.concat([ch, nameBuf]));
    offset += 30 + nameBuf.length + compressed.length;
  });

  const centralDir = Buffer.concat(centralHeaders);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, centralDir, eocd]);
}

// Generate 100% valid Microsoft Word (.docx) file
function generateDocxBuffer(text) {
  const paragraphs = (text || "").split(/\n+/).filter(Boolean);
  const pXml = paragraphs.map(p => {
    const escaped = p
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<w:p><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
  }).join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pXml || '<w:p><w:r><w:t>Empty Humanized Deliverable</w:t></w:r></w:p>'}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const files = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rels },
    { name: 'word/document.xml', data: docXml }
  ];

  return buildZipArchive(files);
}

// Generate 100% valid Adobe PDF (.pdf) file
function generatePdfBuffer(text) {
  const paragraphs = (text || "").split(/\n+/).filter(Boolean);
  let streamText = "BT\n/F1 11 Tf\n14.5 TL\n54 740 Td\n";

  paragraphs.forEach(p => {
    // Wrap at ~85 chars
    const words = p.split(/\s+/);
    let line = "";
    words.forEach(w => {
      if ((line + " " + w).length > 85) {
        const clean = line.trim().replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        streamText += `(${clean}) '\n`;
        line = w;
      } else {
        line = line ? (line + " " + w) : w;
      }
    });
    if (line) {
      const clean = line.trim().replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      streamText += `(${clean}) '\n`;
    }
    streamText += "T*\n";
  });
  streamText += "ET";

  const streamBuf = Buffer.from(streamText, 'binary');
  const streamLen = streamBuf.length;

  const header = "%PDF-1.4\n";
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  const obj4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream\nendobj\n`;
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  let offset = header.length;
  const offsets = [0];
  offsets.push(offset);
  offset += Buffer.byteLength(obj1);
  offsets.push(offset);
  offset += Buffer.byteLength(obj2);
  offsets.push(offset);
  offset += Buffer.byteLength(obj3);
  offsets.push(offset);
  offset += Buffer.byteLength(obj4);
  offsets.push(offset);
  offset += Buffer.byteLength(obj5);

  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + " 00000 n \n";
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return Buffer.from(fullPdf, 'binary');
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text = "", format = "docx", filename } = req.body || {};
    const safeFormat = (format || "docx").toLowerCase();
    const finalName = filename || `Humanized_Deliverable_${Date.now()}.${safeFormat}`;

    let buffer;
    let mimeType;

    if (safeFormat === "docx") {
      buffer = generateDocxBuffer(text);
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (safeFormat === "pdf") {
      buffer = generatePdfBuffer(text);
      mimeType = "application/pdf";
    } else {
      buffer = Buffer.from(text, 'utf-8');
      mimeType = "text/plain; charset=utf-8";
    }

    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return res.status(200).json({
      success: true,
      filename: finalName,
      download_url: dataUrl,
      size_bytes: buffer.length,
      format: safeFormat
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
