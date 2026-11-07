/**
 * document_parser.js
 * Universal Document & MIME-Type Ingestion and Layout Preservation Engine for Paraphraser.
 * Fully developed in JavaScript for Node.js and Browser environments.
 * Architected by J.D | Duino Inc. All rights are preserved.
 *
 * Supports:
 * - PDF (.pdf) via stream deflate extraction and structural text decoding
 * - Word (.docx, .doc) via native zip/zlib inflation of word/document.xml
 * - Markdown (.md, .markdown)
 * - LaTeX (.tex)
 * - HTML (.html, .htm)
 * - Plain Text (.txt, .text)
 * - Rich Text (.rtf)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { TextNormalizer } = require('./text_normalizer.js');

class UniversalDocumentParser {
  /**
   * Sanitizes and normalizes any path or URI format:
   * - file:///C:/path/to/file%20name.pdf -> C:\path\to\file name.pdf
   * - file://path -> path
   * - Unquotes URL encoded characters (%20, %28, etc.)
   * - Normalizes Windows slashes and drive letters
   */
  static resolveFilePath(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') return null;

    let clean = inputStr.trim().replace(/^['"`<]+|['"`>]+$/g, '');

    // Handle file URI schemes
    if (clean.toLowerCase().startsWith('file:///')) {
      clean = clean.substring(8);
    } else if (clean.toLowerCase().startsWith('file://')) {
      clean = clean.substring(7);
    } else if (clean.toLowerCase().startsWith('file:')) {
      clean = clean.substring(5);
    }

    try {
      clean = decodeURIComponent(clean);
    } catch (_) {}

    // Handle Windows leading slash before drive letter e.g. /C:/ -> C:/
    if (/^\/[a-zA-Z]:/.test(clean)) {
      clean = clean.substring(1);
    }

    const norm = path.normalize(clean);
    if (fs.existsSync(norm) && fs.statSync(norm).isFile()) {
      return path.resolve(norm);
    }

    const absNorm = path.resolve(process.cwd(), norm);
    if (fs.existsSync(absNorm) && fs.statSync(absNorm).isFile()) {
      return absNorm;
    }

    const altNorm = norm.includes('/') ? norm.replace(/\//g, '\\') : norm.replace(/\\/g, '/');
    if (fs.existsSync(altNorm) && fs.statSync(altNorm).isFile()) {
      return path.resolve(altNorm);
    }

    return null;
  }

  /**
   * Determines if the input looks like a file path rather than literal text.
   */
  static isLikelyFilePath(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') return false;
    const clean = inputStr.trim().replace(/^['"`<]+|['"`>]+$/g, '');
    if (/^file:\/\//i.test(clean)) return true;

    const exts = ['.pdf', '.docx', '.doc', '.md', '.markdown', '.tex', '.html', '.htm', '.rtf', '.txt', '.odt'];
    const lower = clean.toLowerCase();
    for (const ext of exts) {
      if (lower.endsWith(ext)) return true;
    }
    if ((clean.includes('/') || clean.includes('\\')) && !clean.includes('\n') && clean.length < 500) {
      return true;
    }
    return false;
  }

  /**
   * Determines the document category by extension and mime type.
   */
  static detectType(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
    if (['pdf'].includes(ext)) return 'pdf';
    if (['docx', 'doc'].includes(ext)) return 'docx';
    if (['md', 'markdown'].includes(ext)) return 'markdown';
    if (['tex', 'latex'].includes(ext)) return 'latex';
    if (['html', 'htm', 'xhtml'].includes(ext)) return 'html';
    if (['rtf'].includes(ext)) return 'rtf';
    if (['txt', 'text', 'log', 'rst'].includes(ext)) return 'text';
    return 'text';
  }

  /**
   * Extracts text from a DOCX buffer by locating word/document.xml in the PK zip stream.
   */
  static parseDocxBuffer(buffer) {
    try {
      const PK_HEADER = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
      let offset = 0;
      let xmlContent = '';

      while (offset < buffer.length - 4) {
        const pkIdx = buffer.indexOf(PK_HEADER, offset);
        if (pkIdx === -1) break;

        const fnLen = buffer.readUInt16LE(pkIdx + 26);
        const extraLen = buffer.readUInt16LE(pkIdx + 28);
        const compMethod = buffer.readUInt16LE(pkIdx + 8);
        const compSize = buffer.readUInt32LE(pkIdx + 18);

        const fnStart = pkIdx + 30;
        const fnEnd = fnStart + fnLen;
        if (fnEnd > buffer.length) break;

        const filename = buffer.slice(fnStart, fnEnd).toString('utf8');
        const dataStart = fnEnd + extraLen;

        if (filename === 'word/document.xml') {
          const compData = buffer.slice(dataStart, dataStart + compSize);
          if (compMethod === 8) { // Deflated
            try {
              xmlContent = zlib.inflateRawSync(compData).toString('utf8');
            } catch (_) {
              try {
                xmlContent = zlib.inflateSync(compData).toString('utf8');
              } catch (_) {}
            }
          } else if (compMethod === 0) { // Stored
            xmlContent = compData.toString('utf8');
          }
          break;
        }

        offset = pkIdx + 4;
      }

      if (xmlContent) {
        // Extract paragraphs and table cells
        const paras = [];
        const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/gi;
        let pMatch;
        while ((pMatch = pRegex.exec(xmlContent)) !== null) {
          const pXml = pMatch[1];
          const tRegex = /<w:t(?:\s+[^>]*)?>([^<]*)<\/w:t>/gi;
          let pText = '';
          let tMatch;
          while ((tMatch = tRegex.exec(pXml)) !== null) {
            pText += tMatch[1];
          }
          if (pText.trim()) paras.push(pText.trim());
        }
        return paras.join('\n\n');
      }
    } catch (_) {}

    return buffer.toString('utf8', 0, Math.min(buffer.length, 1000000));
  }

  /**
   * Extracts text from a PDF buffer using FlateDecode deflation and BT...ET block parsing.
   */
  static parsePdfBuffer(buffer) {
    try {
      const textChunks = [];
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      const str = buffer.toString('binary');
      let match;

      while ((match = streamRegex.exec(str)) !== null) {
        const streamData = Buffer.from(match[1], 'binary');
        let decoded = '';

        try {
          decoded = zlib.inflateSync(streamData).toString('utf8');
        } catch (_) {
          try {
            decoded = zlib.inflateRawSync(streamData).toString('utf8');
          } catch (_) {
            decoded = streamData.toString('utf8');
          }
        }

        const btRegex = /BT[\s\S]*?ET/g;
        let btMatch;
        while ((btMatch = btRegex.exec(decoded)) !== null) {
          const block = btMatch[0];
          // Simple Tj
          const tjRegex = /\((.*?)\)\s*(?:Tj|'|")/g;
          let tjMatch;
          while ((tjMatch = tjRegex.exec(block)) !== null) {
            textChunks.push(tjMatch[1].replace(/\\([\\()])/g, '$1'));
          }
          // Array TJ
          const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
          let arrayMatch;
          while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
            const inner = arrayMatch[1];
            const innerStrings = inner.match(/\((.*?)\)/g) || [];
            for (const s of innerStrings) {
              textChunks.push(s.slice(1, -1).replace(/\\([\\()])/g, '$1'));
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

      // Filter out footer strings e.g. Page 1 of 4
      const filtered = textChunks.filter(line => !/^\s*Page\s+\d+(\s+of\s+\d+)?\s*$/i.test(line));
      if (filtered.length > 0) return filtered.join('\n');
    } catch (_) {}

    return buffer.toString('utf8', 0, Math.min(buffer.length, 1000000));
  }

  /**
   * Cleans RTF control words and decodes hex escapes.
   */
  static parseRtf(rawText) {
    let text = rawText.replace(/\\par[d]?\b/gi, '\n');
    text = text.replace(/\\line\b/gi, '\n');
    text = text.replace(/\\tab\b/gi, '\t');
    text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    text = text.replace(/{\*?\\[^{}]+}/g, '');
    text = text.replace(/\\[a-zA-Z]+-?[0-9]* ?/g, '');
    text = text.replace(/[{}]/g, '');
    return text.trim();
  }

  /**
   * Cleans LaTeX commands, math delimiters, and section macros.
   */
  static parseLatex(rawText) {
    let text = rawText.replace(/%.*$/gm, '');
    text = text.replace(/\\(section|subsection|chapter)\*?\{([^}]+)\}/gi, '\n\n## $2\n\n');
    text = text.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^}]*)\})?/g, '$1');
    text = text.replace(/[$}{]/g, '');
    return text.trim();
  }

  /**
   * Cleans HTML markup while extracting semantic paragraphs.
   */
  static parseHtml(rawText) {
    let clean = rawText.replace(/<script[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
    clean = clean.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n## $1\n\n');
    clean = clean.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n\n$1\n\n');
    clean = clean.replace(/<br\s*\/?>/gi, '\n');
    clean = clean.replace(/<[^>]+>/g, ' ');
    clean = clean.replace(/&nbsp;/gi, ' ');
    clean = clean.replace(/&amp;/gi, '&');
    clean = clean.replace(/&lt;/gi, '<');
    clean = clean.replace(/&gt;/gi, '>');
    return clean.trim();
  }

  /**
   * Performs semantic layout analysis to detect titles, metadata, sections, and references.
   */
  static analyzeLayout(text) {
    const paragraphs = text.split('\n\n').map(p => p.trim()).filter(Boolean);
    const layout = {
      has_layout: false,
      title: null,
      metadata: [],
      sections: [],
      references: []
    };

    if (paragraphs.length === 0) return layout;

    let inReferences = false;
    const metaRegex = /^(Title|Student|Author|Course|Professor|Instructor|Date|Abstract|Keywords):/i;
    const refHeadingRegex = /^(References|Bibliography|Works Cited)/i;
    const secHeadingRegex = /^(?:#{1,6}\s+|[IVXLCDM]+\.\s+|[0-9]+\.[0-9]*\s+|Section\s+[0-9]+:?|Chapter\s+[0-9]+:?)/i;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];

      if (refHeadingRegex.test(p)) {
        inReferences = true;
        layout.references.push({ heading: p, items: [] });
        continue;
      }

      if (inReferences) {
        if (layout.references.length > 0) {
          layout.references[layout.references.length - 1].items.push(p);
        }
        continue;
      }

      if (i === 0 && !metaRegex.test(p) && p.length < 180 && !p.endsWith('.')) {
        layout.title = p.replace(/^#+\s*/, '');
        layout.has_layout = true;
        continue;
      }

      if (metaRegex.test(p) || (i < 5 && p.length < 100 && !p.endsWith('.'))) {
        layout.metadata.push(p);
        layout.has_layout = true;
        continue;
      }

      if (secHeadingRegex.test(p)) {
        layout.sections.push({ heading: p, body_paragraphs: [] });
        layout.has_layout = true;
        continue;
      }

      if (layout.sections.length > 0) {
        layout.sections[layout.sections.length - 1].body_paragraphs.push(p);
      } else {
        layout.sections.push({ heading: 'Body', body_paragraphs: [p] });
      }
    }

    return layout;
  }

  /**
   * Reads any document from disk and returns parsed text with metadata.
   */
  static read(filePath) {
    const resolved = this.resolveFilePath(filePath);
    if (!resolved) {
      throw new Error(`File not found or could not be resolved: '${filePath}'`);
    }

    const ext = this.detectType(resolved);
    const buffer = fs.readFileSync(resolved);
    let rawText = '';

    if (ext === 'docx') {
      rawText = this.parseDocxBuffer(buffer);
    } else if (ext === 'pdf') {
      rawText = this.parsePdfBuffer(buffer);
    } else if (ext === 'html') {
      rawText = this.parseHtml(buffer.toString('utf8'));
    } else if (ext === 'rtf') {
      rawText = this.parseRtf(buffer.toString('utf8'));
    } else if (ext === 'latex') {
      rawText = this.parseLatex(buffer.toString('utf8'));
    } else {
      rawText = buffer.toString('utf8');
    }

    const cleanText = TextNormalizer.sanitize(rawText);
    const layout = this.analyzeLayout(cleanText);
    const wordCount = cleanText.trim() ? cleanText.trim().split(/\s+/).filter(Boolean).length : 0;

    return {
      text: cleanText,
      doc_type: ext,
      filename: path.basename(resolved),
      path: resolved,
      metadata: layout.metadata,
      structured_layout: layout,
      char_count: cleanText.length,
      word_count: wordCount
    };
  }

  /**
   * In-memory parsing for buffers, base64 strings, or uploaded files.
   */
  static parseBuffer(buffer, filename = 'document.txt', format = null) {
    const ext = (format || path.extname(filename).toLowerCase().replace(/^\./, '') || 'txt').toLowerCase();
    let rawText = '';

    if (ext === 'docx' || ext === 'doc') {
      rawText = this.parseDocxBuffer(buffer);
    } else if (ext === 'pdf') {
      rawText = this.parsePdfBuffer(buffer);
    } else if (ext === 'html' || ext === 'htm') {
      rawText = this.parseHtml(buffer.toString('utf8'));
    } else if (ext === 'rtf') {
      rawText = this.parseRtf(buffer.toString('utf8'));
    } else if (ext === 'tex' || ext === 'latex') {
      rawText = this.parseLatex(buffer.toString('utf8'));
    } else {
      rawText = buffer.toString('utf8');
    }

    const cleanText = TextNormalizer.sanitize(rawText);
    const layout = this.analyzeLayout(cleanText);
    const wordCount = cleanText.trim() ? cleanText.trim().split(/\s+/).filter(Boolean).length : 0;

    return {
      text: cleanText,
      doc_type: ext,
      filename: path.basename(filename),
      metadata: layout.metadata,
      structured_layout: layout,
      char_count: cleanText.length,
      word_count: wordCount
    };
  }
}

// Module export for Node.js & universal global for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UniversalDocumentParser };
}
if (typeof window !== 'undefined') {
  window.UniversalDocumentParser = UniversalDocumentParser;
}
