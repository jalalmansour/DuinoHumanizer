#!/usr/bin/env python3
"""
document_parser.py
Universal Document & MIME-Type Ingestion and Layout Preservation Engine for Paraphraser.
Supports extracting text and structure from:
- PDF (.pdf) via PyMuPDF (fitz) block extraction
- Word (.docx, .doc) via python-docx
- Markdown (.md, .markdown)
- LaTeX (.tex)
- HTML (.html, .htm) via BeautifulSoup
- Plain Text (.txt, .text)
- Rich Text (.rtf)
- ODT, CSV, JSON, and arbitrary text/MIME types

Layout Preservation Features:
- Preserves exact document headers, student/course/professor metadata anchors
- Identifies Roman numeral sections (I., II., III., etc.) as structural headings
- Preserves APA / academic references without paraphrasing corruption
- Filters out PDF page footers (e.g. 'Page 1 of 4')
- Supports structured docx / md formatting export
- Normalizes file:/// URIs and percent-encoded paths (%20)
Fully developed by J.D | Duino Inc. All rights are preserved.
"""

import os
import sys
import re
import urllib.parse
import mimetypes
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
from text_normalizer import TextNormalizer


class UniversalDocumentParser:
    """Extracts text and layout metadata from any MIME-type document."""

    @staticmethod
    def resolve_file_path(input_str: str) -> Optional[str]:
        """
        Sanitizes and normalizes any path or URI format:
        - file:///C:/path/to/file%20name.pdf -> C:\\path\\to\\file name.pdf
        - file://path -> path
        - Unquotes URL encoded characters (%20, %28, %2B, etc.)
        - Strips surrounding quotes, backticks, angle brackets
        - Normalizes Windows slashes and drive letters
        Returns the resolved existing absolute path, or None if not an existing file on disk.
        """
        if not input_str or not isinstance(input_str, str):
            return None

        clean = input_str.strip().strip("'\"`<>")

        # Handle file URI scheme
        if clean.lower().startswith("file:///"):
            clean = clean[8:]
        elif clean.lower().startswith("file://"):
            clean = clean[7:]
        elif clean.lower().startswith("file:"):
            clean = clean[5:]

        # URL decode (%20 -> space, etc.)
        clean = urllib.parse.unquote(clean)

        # Handle Windows leading slash before drive letter e.g. /C:/ -> C:/
        if re.match(r"^/[a-zA-Z]:", clean):
            clean = clean[1:]

        # Check direct path
        norm = os.path.normpath(clean)
        if os.path.isfile(norm):
            return os.path.abspath(norm)

        # Check relative to cwd
        abs_norm = os.path.abspath(norm)
        if os.path.isfile(abs_norm):
            return abs_norm

        # Check alternative slash orientation
        alt_norm = norm.replace("/", "\\") if os.name == "nt" else norm.replace("\\", "/")
        if os.path.isfile(alt_norm):
            return os.path.abspath(alt_norm)

        return None

    @staticmethod
    def is_likely_file_path(input_str: str) -> bool:
        """Determines if the input looks like a file path rather than literal text."""
        if not input_str or not isinstance(input_str, str):
            return False
        clean = input_str.strip().strip("'\"`<>")
        if clean.lower().startswith(("file://", "file:/")):
            return True
        exts = [".pdf", ".docx", ".doc", ".md", ".markdown", ".tex", ".html", ".htm", ".rtf", ".txt", ".odt"]
        for ext in exts:
            if clean.lower().endswith(ext):
                return True
        if ("/" in clean or "\\" in clean) and len(clean.splitlines()) == 1 and len(clean) < 500:
            return True
        return False

    @staticmethod
    def detect_type(file_path: str) -> str:
        """Determines the document category by extension and mime type."""
        ext = os.path.splitext(file_path)[1].lower().lstrip(".")
        if ext in ["pdf"]:
            return "pdf"
        elif ext in ["docx", "doc"]:
            return "docx"
        elif ext in ["md", "markdown"]:
            return "markdown"
        elif ext in ["tex", "latex"]:
            return "latex"
        elif ext in ["html", "htm", "xhtml"]:
            return "html"
        elif ext in ["txt", "text", "log", "rst"]:
            return "text"
        elif ext in ["rtf"]:
            return "rtf"

        mime, _ = mimetypes.guess_type(file_path)
        if mime:
            if "pdf" in mime:
                return "pdf"
            elif "word" in mime or "officedocument" in mime:
                return "docx"
            elif "html" in mime:
                return "html"
            elif "text" in mime:
                return "text"

        return "text"

    @classmethod
    def read(cls, file_path: str) -> Dict[str, Any]:
        """
        Reads any document and returns:
        {
            "text": str,
            "doc_type": str,
            "filename": str,
            "path": str,
            "metadata": dict,
            "structured_layout": dict,
            "char_count": int,
            "word_count": int
        }
        """
        resolved = cls.resolve_file_path(file_path)
        if not resolved:
            raise FileNotFoundError(f"File not found or could not be resolved: '{file_path}'")

        ext = cls.detect_type(resolved)
        raw_text = ""

        if ext == "pdf":
            try:
                import fitz
                doc = fitz.open(resolved)
                pages = []
                for page in doc:
                    p_text = page.get_text()
                    lines = [l for l in p_text.splitlines() if not re.match(r"^\s*Page\s+\d+(\s+of\s+\d+)?\s*$", l, re.I)]
                    pages.append("\n".join(lines))
                raw_text = "\n\n".join(pages)
            except Exception as e:
                with open(resolved, "rb") as f:
                    raw_text = f.read().decode("utf-8", errors="ignore")

        elif ext == "docx":
            try:
                import docx
                doc = docx.Document(resolved)
                paras = [p.text for p in doc.paragraphs if p.text.strip()]
                for t in doc.tables:
                    for row in t.rows:
                        row_text = "\t".join(c.text.strip() for c in row.cells if c.text.strip())
                        if row_text:
                            paras.append(row_text)
                raw_text = "\n\n".join(paras)
            except Exception as e:
                with open(resolved, "rb") as f:
                    raw_text = f.read().decode("utf-8", errors="ignore")

        elif ext == "html":
            try:
                from bs4 import BeautifulSoup
                with open(resolved, "r", encoding="utf-8", errors="ignore") as f:
                    soup = BeautifulSoup(f.read(), "html.parser")
                    raw_text = soup.get_text(separator="\n\n")
            except Exception:
                with open(resolved, "r", encoding="utf-8", errors="ignore") as f:
                    raw_text = f.read()

        else:
            with open(resolved, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read()

        # Universal Text Normalization & Sanitization Pipeline (J.D | Duino Inc)
        clean_text = TextNormalizer.sanitize(raw_text)
        layout = cls.analyze_layout(clean_text)

        return {
            "text": clean_text,
            "doc_type": ext,
            "filename": os.path.basename(resolved),
            "path": resolved,
            "metadata": layout.get("metadata", []),
            "structured_layout": layout,
            "char_count": len(clean_text),
            "word_count": len(clean_text.split()),
        }

    @classmethod
    def analyze_layout(cls, text: str) -> Dict[str, Any]:
        """
        Analyzes and decomposes structured text into:
        - title
        - metadata anchors (Student's name, Course, Professor, Date, Author, etc.)
        - sections (Roman numerals I., II., etc. or markdown headings)
        - references
        - has_layout: bool
        """
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines:
            return {"has_layout": False, "title": "", "metadata": [], "sections": [], "references": []}

        title = lines[0]
        metadata = []
        sections = []
        references = []

        ref_index = -1
        for i, l in enumerate(lines):
            if re.match(r"^(References|Bibliography|Works Cited|Sources)\b", l, re.I):
                ref_index = i
                break

        if ref_index != -1:
            references = lines[ref_index+1:]
            content_lines = lines[:ref_index]
        else:
            content_lines = lines

        idx = 1
        meta_keys = ["student", "name", "course", "professor", "date", "author", "instructor", "class", "university"]
        while idx < len(content_lines):
            l = content_lines[idx]
            if any(k in l.lower() for k in meta_keys) and (":" in l or "-" in l):
                metadata.append(l)
                idx += 1
            else:
                break

        body_lines = content_lines[idx:]
        current_heading = "Introduction"
        current_paras = []

        for l in body_lines:
            if re.match(r"^([IVXLCDM]+\.|\d+\.|\#+)\s+.*", l, re.I) and len(l) < 120:
                if current_paras:
                    sections.append({
                        "heading": current_heading,
                        "body_paragraphs": current_paras
                    })
                    current_paras = []
                current_heading = l
            else:
                current_paras.append(l)

        if current_paras:
            sections.append({
                "heading": current_heading,
                "body_paragraphs": current_paras
            })

        has_layout = bool(metadata or len(sections) > 1 or references)

        return {
            "has_layout": has_layout,
            "title": title,
            "metadata": metadata,
            "sections": sections,
            "references": references,
        }

    @classmethod
    def save_output(cls, text: str, output_path: str = None, out_path: str = None, ext: str = None, source_type: str = None) -> str:
        target_path = output_path or out_path
        if not target_path:
            raise ValueError("Output path must be specified.")
        out_p = Path(target_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        if not ext:
            ext = (out_p.suffix.lower().lstrip(".") or source_type or "txt").lower()

        layout = cls.analyze_layout(text)

        if ext == "pdf":
            try:
                from reportlab.lib.pagesizes import letter
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib import colors

                doc = SimpleDocTemplate(
                    str(out_p),
                    pagesize=letter,
                    rightMargin=54,
                    leftMargin=54,
                    topMargin=54,
                    bottomMargin=54,
                )
                styles = getSampleStyleSheet()

                title_style = ParagraphStyle(
                    'DocTitle',
                    parent=styles['Heading1'],
                    fontName='Helvetica-Bold',
                    fontSize=20,
                    leading=24,
                    textColor=colors.HexColor('#111827'),
                    spaceAfter=12,
                )
                meta_style = ParagraphStyle(
                    'DocMeta',
                    parent=styles['Normal'],
                    fontName='Helvetica',
                    fontSize=10,
                    leading=14,
                    textColor=colors.HexColor('#374151'),
                    spaceAfter=4,
                )
                heading_style = ParagraphStyle(
                    'DocHeading',
                    parent=styles['Heading2'],
                    fontName='Helvetica-Bold',
                    fontSize=13,
                    leading=18,
                    textColor=colors.HexColor('#1F2937'),
                    spaceBefore=14,
                    spaceAfter=6,
                )
                body_style = ParagraphStyle(
                    'DocBody',
                    parent=styles['Normal'],
                    fontName='Helvetica',
                    fontSize=11,
                    leading=16,
                    textColor=colors.HexColor('#1F2937'),
                    spaceAfter=8,
                )
                ref_style = ParagraphStyle(
                    'DocRef',
                    parent=styles['Normal'],
                    fontName='Helvetica',
                    fontSize=9.5,
                    leading=14,
                    leftIndent=24,
                    firstLineIndent=-24,
                    textColor=colors.HexColor('#374151'),
                    spaceAfter=5,
                )

                story = []

                if layout.get("title"):
                    story.append(Paragraph(layout["title"], title_style))

                for meta in layout.get("metadata", []):
                    clean_meta = meta.lstrip("-*• ").strip()
                    if ":" in clean_meta:
                        key, val = clean_meta.split(":", 1)
                        story.append(Paragraph(f"<b>{key}:</b> {val.strip()}", meta_style))
                    else:
                        story.append(Paragraph(clean_meta, meta_style))

                if layout.get("metadata"):
                    story.append(Spacer(1, 10))

                for sec in layout.get("sections", []):
                    if sec.get("heading") and sec["heading"] != "Introduction":
                        story.append(Paragraph(sec["heading"], heading_style))

                    for p in sec.get("body_paragraphs", []):
                        story.append(Paragraph(p, body_style))

                if layout.get("references"):
                    story.append(Paragraph("References", heading_style))
                    for ref in layout["references"]:
                        story.append(Paragraph(ref, ref_style))

                doc.build(story)
                return str(out_p)
            except Exception as e:
                print(f"[DocumentParser Warning] PDF export error: {e}. Falling back to text.")

        if ext == "docx":
            try:
                import docx
                from docx.shared import Pt, Inches, RGBColor
                doc = docx.Document()
                if layout.get("title"):
                    doc.add_heading(layout["title"], level=0)
                for meta in layout.get("metadata", []):
                    p = doc.add_paragraph()
                    p.paragraph_format.space_after = Pt(2)
                    if ":" in meta:
                        k, v = meta.split(":", 1)
                        r1 = p.add_run(k + ": ")
                        r1.bold = True
                        p.add_run(v.strip())
                    else:
                        p.add_run(meta)
                for sec in layout.get("sections", []):
                    if sec.get("heading") and sec["heading"] != "Introduction":
                        doc.add_heading(sec["heading"], level=1)
                    for para in sec.get("body_paragraphs", []):
                        doc.add_paragraph(para)
                if layout.get("references"):
                    doc.add_heading("References", level=1)
                    for ref in layout["references"]:
                        p = doc.add_paragraph(ref)
                        p.paragraph_format.left_indent = Inches(0.5)
                        p.paragraph_format.first_line_indent = Inches(-0.5)
                doc.save(str(out_p))
                return str(out_p)
            except Exception as e:
                print(f"[DocumentParser Warning] DOCX export error: {e}. Falling back to text.")

        out_p.write_text(text, encoding="utf-8")
        return str(out_p)
