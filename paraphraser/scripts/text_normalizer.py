#!/usr/bin/env python3
"""
text_normalizer.py
Universal Text Normalization & Sanitization Pipeline for Duino Humanizer.
Architected & Fully Developed by J.D | Duino Inc. All rights are preserved.

Features:
1. Automatically detects and styles headings, and breaks up long paragraphs.
2. Removes invisible characters (zero-width spaces, soft hyphens, byte order marks, etc.).
3. Converts curly double quotes (" ") to straight ASCII (").
4. Converts curly single quotes (' ') to straight ASCII (').
5. Converts em dash (—) and en dash (–) to regular hyphen (-).
6. Converts ellipsis (…) to three dots (...).
7. Removes emojis and special characters not on standard keyboards.
8. Removes multiple spaces and excessive line breaks.
9. Chunks long texts into semantic blocks of at most 1,200 words.
"""

import re
import unicodedata
from typing import List, Tuple, Dict, Any

# Target chunk size strictly 1,200 words
MAX_CHUNK_WORDS = 1200

# Invisible Unicode characters regex
INVISIBLE_CHARS_REGEX = re.compile(
    r"[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u200E\u200F\u202A-\u202E\u2066-\u2069]"
)

# Curly double quotes to straight ASCII "
CURLY_DOUBLE_QUOTES_REGEX = re.compile(r"[\u201C\u201D\u201E\u201F\u00AB\u00BB\u301D\u301E]")

# Curly single quotes to straight ASCII '
CURLY_SINGLE_QUOTES_REGEX = re.compile(r"[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]")

# Em and en dashes to regular hyphen -
DASHES_REGEX = re.compile(r"[\u2014\u2013\u2012\u2015\u2212\uFE58\uFE63]")

# Ellipsis to three dots ...
ELLIPSIS_REGEX = re.compile(r"[\u2026]")

# Emoji and non-standard symbols regex (surrogate pairs & dingbats)
EMOJI_REGEX = re.compile(
    r"[\U00010000-\U0010ffff]|[\u2600-\u27BF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\u3030\u303D]|[\u3297\u3299]"
)


class TextNormalizer:
    """Production Text Normalizer and Sanitizer Engine."""

    @classmethod
    def sanitize(cls, text: str, auto_format_headings: bool = True, break_paragraphs: bool = True) -> str:
        """
        Executes the complete sanitization pipeline on any document or pasted text.
        """
        if not text:
            return ""

        # 1. Normalize line endings to Unix style \n
        cleaned = text.replace("\r\n", "\n").replace("\r", "\n")

        # 2. Remove invisible characters (zero-width spaces, soft hyphens, etc.)
        cleaned = INVISIBLE_CHARS_REGEX.sub("", cleaned)

        # 3. Normalize non-breaking spaces and exotic spaces to standard ASCII space
        cleaned = re.sub(r"[\u00A0\u202F\u2007\u2009\u200A\u1680\u2000-\u2006\u2008\u3000]", " ", cleaned)

        # 4. Convert curly double quotes to straight ASCII "
        cleaned = CURLY_DOUBLE_QUOTES_REGEX.sub('"', cleaned)

        # 5. Convert curly single quotes to straight ASCII '
        cleaned = CURLY_SINGLE_QUOTES_REGEX.sub("'", cleaned)

        # 6. Convert em dash (—) and en dash (–) to regular hyphen -
        cleaned = DASHES_REGEX.sub("-", cleaned)

        # 7. Convert ellipsis (…) to three dots ...
        cleaned = ELLIPSIS_REGEX.sub("...", cleaned)

        # 8. Remove emojis and special non-keyboard pictographs
        cleaned = EMOJI_REGEX.sub("", cleaned)

        # 9. Clean up illegal control characters while preserving \n and \t
        cleaned = "".join(ch for ch in cleaned if ch == "\n" or ch == "\t" or (32 <= ord(ch) <= 126) or (160 <= ord(ch) <= 255) or unicodedata.category(ch).startswith(("L", "N", "P", "Z", "S")))

        # 10. Collapse multiple consecutive spaces and tabs on the same line
        lines = cleaned.split("\n")
        normalized_lines = []
        for line in lines:
            line_cleaned = re.sub(r"[ \t]+", " ", line).strip()
            normalized_lines.append(line_cleaned)

        cleaned = "\n".join(normalized_lines)

        # 11. Normalize excessive line breaks (limit to at most 2 consecutive newlines)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()

        # 12. Automatically detect and style headings, and break up long paragraphs
        if auto_format_headings or break_paragraphs:
            cleaned = cls.detect_headings_and_balance_paragraphs(cleaned, auto_format_headings, break_paragraphs)

        return cleaned

    @classmethod
    def detect_headings_and_balance_paragraphs(
        cls, text: str, format_headings: bool = True, break_long_paragraphs: bool = True
    ) -> str:
        """
        Detects headings (Title Case lines, Roman numerals, Section prefixes) and
        breaks up overly long paragraphs (> 120 words) into balanced, readable sections.
        """
        paragraphs = text.split("\n\n")
        processed_paragraphs = []

        heading_pattern = re.compile(
            r"^(?:#{1,6}\s+|[IVXLCDM]+\.\s+|[0-9]+\.[0-9]*\s+|Section\s+[0-9]+:?|Chapter\s+[0-9]+:?|Abstract|Introduction|Methodology|Results|Discussion|Conclusion|References|Bibliography)",
            re.IGNORECASE
        )

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue

            lines = p.split("\n")
            # Check if this paragraph is a standalone heading
            if len(lines) == 1 and len(p.split()) <= 12 and not p.endswith((".", ";", ":", ",")):
                if heading_pattern.match(p) or (p.isupper() and len(p) > 3) or p.istitle():
                    if format_headings:
                        # Ensure header is cleanly styled
                        p_head = p.lstrip("# ").strip()
                        processed_paragraphs.append(f"## {p_head}")
                    else:
                        processed_paragraphs.append(p)
                    continue

            # Check if paragraph needs breaking up (> 120 words)
            words = p.split()
            if break_long_paragraphs and len(words) > 120:
                # Break up long paragraphs at natural sentence boundaries
                sentences = re.split(r"(?<=[.!?])\s+", p)
                current_block = []
                current_word_count = 0

                for s in sentences:
                    s_words = len(s.split())
                    if current_word_count + s_words > 100 and current_word_count >= 60:
                        processed_paragraphs.append(" ".join(current_block).strip())
                        current_block = [s]
                        current_word_count = s_words
                    else:
                        current_block.append(s)
                        current_word_count += s_words

                if current_block:
                    processed_paragraphs.append(" ".join(current_block).strip())
            else:
                processed_paragraphs.append(p)

        return "\n\n".join(processed_paragraphs)

    @classmethod
    def chunk_text(cls, text: str, max_words: int = MAX_CHUNK_WORDS) -> List[Dict[str, Any]]:
        """
        Splits a text into semantic chunks of at most `max_words` (default 1,200 words).
        Preserves paragraph boundaries and sentence integrity.
        """
        paragraphs = text.split("\n\n")
        chunks = []
        current_paras = []
        current_words = 0

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue

            p_words = len(p.split())

            # If a single paragraph is larger than max_words, split it by sentence
            if p_words > max_words:
                if current_paras:
                    chunk_str = "\n\n".join(current_paras)
                    chunks.append({
                        "index": len(chunks) + 1,
                        "text": chunk_str,
                        "word_count": len(chunk_str.split()),
                    })
                    current_paras = []
                    current_words = 0

                sentences = re.split(r"(?<=[.!?])\s+", p)
                sent_accum = []
                sent_words = 0
                for s in sentences:
                    s_words_list = s.split()
                    s_count = len(s_words_list)

                    # If even an individual sentence exceeds max_words, break it by words
                    if s_count > max_words:
                        if sent_accum:
                            s_chunk_str = " ".join(sent_accum)
                            chunks.append({
                                "index": len(chunks) + 1,
                                "text": s_chunk_str,
                                "word_count": len(s_chunk_str.split()),
                            })
                            sent_accum = []
                            sent_words = 0

                        for w_idx in range(0, s_count, max_words):
                            sub_w = s_words_list[w_idx:w_idx + max_words]
                            chunks.append({
                                "index": len(chunks) + 1,
                                "text": " ".join(sub_w),
                                "word_count": len(sub_w),
                            })
                        continue

                    if sent_words + s_count > max_words and sent_accum:
                        s_chunk_str = " ".join(sent_accum)
                        chunks.append({
                            "index": len(chunks) + 1,
                            "text": s_chunk_str,
                            "word_count": len(s_chunk_str.split()),
                        })
                        sent_accum = [s]
                        sent_words = s_count
                    else:
                        sent_accum.append(s)
                        sent_words += s_count

                if sent_accum:
                    s_chunk_str = " ".join(sent_accum)
                    chunks.append({
                        "index": len(chunks) + 1,
                        "text": s_chunk_str,
                        "word_count": len(s_chunk_str.split()),
                    })
                continue

            if current_words + p_words > max_words and current_paras:
                chunk_str = "\n\n".join(current_paras)
                chunks.append({
                    "index": len(chunks) + 1,
                    "text": chunk_str,
                    "word_count": len(chunk_str.split()),
                })
                current_paras = [p]
                current_words = p_words
            else:
                current_paras.append(p)
                current_words += p_words

        if current_paras:
            chunk_str = "\n\n".join(current_paras)
            chunks.append({
                "index": len(chunks) + 1,
                "text": chunk_str,
                "word_count": len(chunk_str.split()),
            })

        return chunks
