/**
 * text_normalizer.js
 * Universal Text Normalization & Sanitization Pipeline for Duino Humanizer.
 * Fully developed in JavaScript for Node.js and Browser environments.
 * Architected by J.D | Duino Inc. All rights are preserved.
 *
 * Features:
 * 1. Automatically detects and styles headings, and breaks up long paragraphs.
 * 2. Removes invisible characters (zero-width spaces, soft hyphens, byte order marks, etc.).
 * 3. Converts curly double quotes (" ") to straight ASCII (").
 * 4. Converts curly single quotes (' ') to straight ASCII (').
 * 5. Converts em dash (—) and en dash (–) to regular hyphen (-).
 * 6. Converts ellipsis (…) to three dots (...).
 * 7. Removes emojis and special characters not on standard keyboards.
 * 8. Removes multiple spaces and excessive line breaks.
 * 9. Chunks long texts into semantic blocks of at most 1,200 words.
 */

const MAX_CHUNK_WORDS = 1200;

// Invisible Unicode characters regex
const INVISIBLE_CHARS_REGEX = /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

// Curly double quotes to straight ASCII "
const CURLY_DOUBLE_QUOTES_REGEX = /[\u201C\u201D\u201E\u201F\u00AB\u00BB\u301D\u301E]/g;

// Curly single quotes to straight ASCII '
const CURLY_SINGLE_QUOTES_REGEX = /[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g;

// Em and en dashes to regular hyphen -
const DASHES_REGEX = /[\u2014\u2013\u2012\u2015\u2212\uFE58\uFE63]/g;

// Ellipsis to three dots ...
const ELLIPSIS_REGEX = /[\u2026]/g;

// Emoji and non-standard symbols regex
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{D83C}-\u{DBFF}\u{DC00}-\u{DFFF}\u{2300}-\u{23FF}\u{2B50}-\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

const HEADING_PATTERN = /^(?:#{1,6}\s+|[IVXLCDM]+\.\s+|[0-9]+\.[0-9]*\s+|Section\s+[0-9]+:?|Chapter\s+[0-9]+:?|Abstract|Introduction|Methodology|Results|Discussion|Conclusion|References|Bibliography)/i;

class TextNormalizer {
  /**
   * Executes the complete sanitization pipeline on any document or pasted text.
   */
  static sanitize(text, autoFormatHeadings = true, breakParagraphs = true) {
    if (!text || typeof text !== 'string') return '';

    // 1. Normalize line endings to Unix style \n
    let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. Remove invisible characters (zero-width spaces, soft hyphens, etc.)
    cleaned = cleaned.replace(INVISIBLE_CHARS_REGEX, '');

    // 3. Normalize non-breaking spaces and exotic spaces to standard ASCII space
    cleaned = cleaned.replace(/[\u00A0\u202F\u2007\u2009\u200A\u1680\u2000-\u2006\u2008\u3000]/g, ' ');

    // 4. Convert curly double quotes to straight ASCII "
    cleaned = cleaned.replace(CURLY_DOUBLE_QUOTES_REGEX, '"');

    // 5. Convert curly single quotes to straight ASCII '
    cleaned = cleaned.replace(CURLY_SINGLE_QUOTES_REGEX, "'");

    // 6. Convert em dash (—) and en dash (–) to regular hyphen -
    cleaned = cleaned.replace(DASHES_REGEX, '-');

    // 7. Convert ellipsis (…) to three dots ...
    cleaned = cleaned.replace(ELLIPSIS_REGEX, '...');

    // 8. Remove emojis and special non-keyboard pictographs
    cleaned = cleaned.replace(EMOJI_REGEX, '');

    // 9. Clean up illegal control characters while preserving \n and \t
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 10. Collapse multiple consecutive spaces and tabs on the same line
    const lines = cleaned.split('\n');
    const normalizedLines = lines.map(line => line.replace(/[ \t]+/g, ' ').trim());
    cleaned = normalizedLines.join('\n');

    // 11. Normalize excessive line breaks (limit to at most 2 consecutive newlines)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    // 12. Automatically detect and style headings, and break up long paragraphs
    if (autoFormatHeadings || breakParagraphs) {
      cleaned = this.detectHeadingsAndBalanceParagraphs(cleaned, autoFormatHeadings, breakParagraphs);
    }

    return cleaned;
  }

  /**
   * Detects headings (Title Case lines, Roman numerals, Section prefixes) and
   * breaks up overly long paragraphs (> 120 words) into balanced, readable sections.
   */
  static detectHeadingsAndBalanceParagraphs(text, formatHeadings = true, breakLongParagraphs = true) {
    const paragraphs = text.split('\n\n');
    const processed = [];

    for (const rawP of paragraphs) {
      const p = rawP.trim();
      if (!p) continue;

      const lines = p.split('\n');
      const words = p.split(/\s+/).filter(Boolean);

      // Check if this paragraph is a standalone heading (single short line without ending punctuation)
      if (lines.length === 1 && words.length <= 12 && !/[.,;:]$/.test(p)) {
        const isUpper = p === p.toUpperCase() && p.length > 3;
        const isTitle = words.every(w => /^[A-Z0-9]/.test(w) || ['and','or','the','in','of','for','to','with','a','an'].includes(w.toLowerCase()));

        if (HEADING_PATTERN.test(p) || isUpper || isTitle) {
          if (formatHeadings) {
            const pHead = p.replace(/^#+\s*/, '').trim();
            processed.push(`## ${pHead}`);
          } else {
            processed.push(p);
          }
          continue;
        }
      }

      // Check if paragraph needs breaking up (> 120 words)
      if (breakLongParagraphs && words.length > 120) {
        const sentences = p.split(/(?<=[.!?])\s+/);
        let currentBlock = [];
        let currentWordCount = 0;

        for (const s of sentences) {
          const sWords = s.split(/\s+/).filter(Boolean).length;
          if (currentWordCount + sWords > 100 && currentWordCount >= 60) {
            processed.push(currentBlock.join(' ').trim());
            currentBlock = [s];
            currentWordCount = sWords;
          } else {
            currentBlock.push(s);
            currentWordCount += sWords;
          }
        }

        if (currentBlock.length > 0) {
          processed.push(currentBlock.join(' ').trim());
        }
      } else {
        processed.push(p);
      }
    }

    return processed.join('\n\n');
  }

  /**
   * Splits a text into semantic chunks of at most `maxWords` (default 1,200 words).
   * Preserves paragraph boundaries and sentence integrity.
   */
  static chunkText(text, maxWords = MAX_CHUNK_WORDS) {
    if (!text || !text.trim()) return [];

    const paragraphs = text.split('\n\n');
    const chunks = [];
    let currentParas = [];
    let currentWords = 0;

    for (const p of paragraphs) {
      const trimmed = p.trim();
      if (!trimmed) continue;

      const pWords = trimmed.split(/\s+/).filter(Boolean).length;

      // If a single paragraph is larger than maxWords, split it by sentence
      if (pWords > maxWords) {
        if (currentParas.length > 0) {
          const chunkStr = currentParas.join('\n\n');
          chunks.push({
            index: chunks.length + 1,
            text: chunkStr,
            word_count: chunkStr.split(/\s+/).filter(Boolean).length
          });
          currentParas = [];
          currentWords = 0;
        }

        const sentences = trimmed.split(/(?<=[.!?])\s+/);
        let sentAccum = [];
        let sentWords = 0;

        for (const s of sentences) {
          const sWordsList = s.split(/\s+/).filter(Boolean);
          const sCount = sWordsList.length;

          // If even an individual sentence exceeds maxWords, break it by words
          if (sCount > maxWords) {
            if (sentAccum.length > 0) {
              const sChunkStr = sentAccum.join(' ');
              chunks.push({
                index: chunks.length + 1,
                text: sChunkStr,
                word_count: sChunkStr.split(/\s+/).filter(Boolean).length
              });
              sentAccum = [];
              sentWords = 0;
            }

            for (let wIdx = 0; wIdx < sCount; wIdx += maxWords) {
              const subW = sWordsList.slice(wIdx, wIdx + maxWords);
              chunks.push({
                index: chunks.length + 1,
                text: subW.join(' '),
                word_count: subW.length
              });
            }
            continue;
          }

          if (sentWords + sCount > maxWords && sentAccum.length > 0) {
            const sChunkStr = sentAccum.join(' ');
            chunks.push({
              index: chunks.length + 1,
              text: sChunkStr,
              word_count: sChunkStr.split(/\s+/).filter(Boolean).length
            });
            sentAccum = [s];
            sentWords = sCount;
          } else {
            sentAccum.push(s);
            sentWords += sCount;
          }
        }

        if (sentAccum.length > 0) {
          const sChunkStr = sentAccum.join(' ');
          chunks.push({
            index: chunks.length + 1,
            text: sChunkStr,
            word_count: sChunkStr.split(/\s+/).filter(Boolean).length
          });
        }
        continue;
      }

      if (currentWords + pWords > maxWords && currentParas.length > 0) {
        const chunkStr = currentParas.join('\n\n');
        chunks.push({
          index: chunks.length + 1,
          text: chunkStr,
          word_count: chunkStr.split(/\s+/).filter(Boolean).length
        });
        currentParas = [trimmed];
        currentWords = pWords;
      } else {
        currentParas.push(trimmed);
        currentWords += pWords;
      }
    }

    if (currentParas.length > 0) {
      const chunkStr = currentParas.join('\n\n');
      chunks.push({
        index: chunks.length + 1,
        text: chunkStr,
        word_count: chunkStr.split(/\s+/).filter(Boolean).length
      });
    }

    return chunks;
  }
}

// Module export for Node.js & universal global for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TextNormalizer, MAX_CHUNK_WORDS };
}
if (typeof window !== 'undefined') {
  window.TextNormalizer = TextNormalizer;
}
