#!/usr/bin/env python3
"""
paraphraser_cli.py
Universal CLI and Pipeline Integration for the 'paraphraser' skill in Duino Deep Researcher.
Features:
- Robust path & URI normalization:
    file:///C:/path/to/Report%20Layout.pdf -> C:\\path\\to\\Report Layout.pdf
    C:/path/with%20encoded%20spaces/doc.docx -> C:\\path\\with encoded spaces\\doc.docx
- Direct ingestion of ANY document / MIME-type: PDF, DOCX, DOC, MD, TEX, HTML, RTF, TXT.
- Complete Layout Preservation:
    * Anchors metadata (Title, Student name, Course, Professor, Date)
    * Preserves Roman numeral section headings (I., II., III., etc.)
    * Preserves academic references without corruption
    * Paraphrases only body text and reassembles layout with 100% fidelity
- SuperHumanizer.ai full UI control:
    * Model selection: 'Super Ultra' (default) & 'Super Lite'
    * Purpose selection: 'Academic' (default), 'Formal', 'General', 'Blog', etc.
- ZeroGPT maximum character payload drop (up to 14,000 chars per scan).
- Exact ZeroGPT DOM parsing:
    Verdict: <span class="header-text text-center">Your text is Human written</span>
    Score:   <div class="percentage-div">...<span class="header-text text-center">0%<br>AI GPT*</span></div>
- Automatic looping until AI GPT detection is strictly < 7.0% (Targeting 0.0% AI GPT | 100.0% Human).
- Visual screenshot self-evaluation receipts with autoscroll.
- 0 API Keys, 100% Free Playwright automation.
"""

import os
import sys
import argparse
import json
import urllib.parse
from pathlib import Path
from copy import deepcopy
from typing import Any, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(HERE, "scripts")
sys.path.insert(0, SCRIPTS_DIR)

from document_parser import UniversalDocumentParser
from loop_verifier import LoopParaphraseEngine


def run_paraphraser(
    input_source: str,
    output_path: str = None,
    target_ai: float = 7.0,
    model: str = "Super Ultra",
    purpose: str = "Academic",
    max_loops: int = 15,
    screenshots_dir: str = None,
    proxy: str = None,
    headless: bool = True,
    progress_callback: Optional[Any] = None,
    **kwargs
) -> dict:
    """
    Directly ingests any text, URI, or document file path (with %20 or file:/// schemes),
    preserves complete layout and structural anchors, runs automatic loop verification
    until AI detection < 7.0% (target 0.0% AI), and saves the humanized deliverable.
    """
    doc_info = None

    if progress_callback:
        progress_callback("INGESTING", {"source": input_source})

    # Resolve file path if input_source represents a file or URI scheme
    resolved_file = UniversalDocumentParser.resolve_file_path(input_source)

    if resolved_file:
        doc_info = UniversalDocumentParser.read(resolved_file)
        text_to_process = doc_info["text"]
        print(f"\n[Document Ingestion] Successfully loaded: '{doc_info['filename']}' ({doc_info['doc_type'].upper()})")
        print(f"[Document Ingestion] Resolved Path: {resolved_file}")
        print(f"[Document Ingestion] Total Characters: {doc_info['char_count']} | Words: {doc_info['word_count']}")
    elif UniversalDocumentParser.is_likely_file_path(input_source):
        clean_hint = urllib.parse.unquote(input_source.strip().strip("'\"`<>"))
        if clean_hint.lower().startswith("file:///"):
            clean_hint = clean_hint[8:]
        print(f"\n[ERROR] The input argument appears to be a document file, but it could not be found on disk:")
        print(f"  Supplied:          {input_source}")
        print(f"  Normalized Search: {clean_hint}")
        print(f"  Please verify that the file exists and that the path is accessible.")
        sys.exit(1)
    else:
        text_to_process = input_source

    if not screenshots_dir:
        if doc_info:
            screenshots_dir = str(Path(doc_info["path"]).parent / "screenshots")
        else:
            screenshots_dir = os.path.join(os.getcwd(), "screenshots")

    engine = LoopParaphraseEngine(
        headless=headless,
        max_loops=max_loops,
        target_max_ai=target_ai,
        model=model,
        purpose=purpose,
        screenshots_dir=screenshots_dir,
        proxy=proxy,
    )

    if progress_callback:
        progress_callback("VERIFYING_BASELINE", {"length": len(text_to_process)})

    # Check if document has structured layout that requires anchor preservation
    layout = doc_info.get("structured_layout") if doc_info else None
    if layout and layout.get("has_layout") and layout.get("sections"):
        print(f"\n[Layout Preservation] Detected structured document with {len(layout['sections'])} sections and metadata anchors.")
        print(f"  Anchors Preserved: Title, {len(layout['metadata'])} metadata items, {len(layout['references'])} references.")

        # Extract only body paragraphs for humanization
        body_blocks = []
        for sec in layout["sections"]:
            for p in sec.get("body_paragraphs", []):
                if p.strip():
                    body_blocks.append(p.strip())

        raw_body_text = "\n\n".join(body_blocks)

        if progress_callback:
            progress_callback("HUMANIZING_LOOPS", {"sections": len(layout["sections"])})

        report = engine.run(raw_body_text)

        # Reconstruct structured layout with humanized body
        humanized_body = report.get("final_text", raw_body_text)
        humanized_paras = [p.strip() for p in humanized_body.split("\n\n") if p.strip()]

        new_layout = deepcopy(layout)
        p_idx = 0
        for sec in new_layout["sections"]:
            sec_len = len(sec.get("body_paragraphs", []))
            if p_idx < len(humanized_paras):
                sec["body_paragraphs"] = humanized_paras[p_idx : p_idx + sec_len]
                p_idx += sec_len

        # Reassemble the entire document preserving all anchors
        reassembled_text = UniversalDocumentParser.reassemble_layout(new_layout)
        report["final_text"] = reassembled_text
        report["structured_layout"] = new_layout

    else:
        # Standard unstructured text or pure prose
        if progress_callback:
            progress_callback("HUMANIZING_LOOPS", {"words": len(text_to_process.split())})
        report = engine.run(text_to_process)

    # Determine default output path if not provided
    if not output_path and doc_info:
        orig_p = Path(doc_info["path"])
        output_path = str(orig_p.parent / f"{orig_p.stem}_humanized{orig_p.suffix}")

    if output_path and report.get("final_text"):
        src_type = doc_info["doc_type"] if doc_info else "text"
        saved_file = UniversalDocumentParser.save_output(
            text=report["final_text"],
            output_path=output_path,
            source_type=src_type,
        )
        print(f"\n[Saved Output] Final humanized document written to: {saved_file}")

        # Save verification audit receipt
        audit_file = str(Path(saved_file).with_suffix(".verification.json"))

        with open(audit_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"[Audit Receipt] Verification evidence saved to: {audit_file}")
        report["output_file"] = saved_file
        report["audit_file"] = audit_file

        if progress_callback:
            progress_callback("COMPLETED", {"output_file": saved_file, "verdict": report.get("verdict")})

    return report


def main():
    parser = argparse.ArgumentParser(
        description="Paraphraser: Universal MIME-Type Humanizer & Max-Capacity Auto-Loop Verifier"
    )
    parser.add_argument(
        "--input", "-i", type=str, required=True,
        help="Path to any document file (.pdf, .docx, .md, .tex, .html, .rtf, .txt), file:/// URI, or direct string"
    )
    parser.add_argument(
        "--output", "-o", type=str, default=None,
        help="Path for saving the humanized document (e.g. output.docx, output.md)"
    )
    parser.add_argument(
        "--target-ai", type=float, default=7.0,
        help="Target max AI GPT detection threshold (default: 7.0%%, targeting 0.0%% AI | 100%% Human)"
    )
    parser.add_argument(
        "--model", "-m", type=str, default="Super Ultra",
        choices=["Super Ultra", "Super Lite"],
        help="SuperHumanizer Model (default: 'Super Ultra')"
    )
    parser.add_argument(
        "--purpose", "-p", type=str, default="Academic",
        choices=["Academic", "Formal", "General", "Blog", "Informal", "Friendly", "Engaging"],
        help="SuperHumanizer Purpose (default: 'Academic')"
    )
    parser.add_argument(
        "--max-loops", type=int, default=15,
        help="Maximum auto-loop iterations before circuit breaker (default: 15)"
    )
    parser.add_argument(
        "--screenshots-dir", type=str, default=None,
        help="Directory to store autoscroll visual screenshots"
    )
    parser.add_argument(
        "--proxy", type=str, default=None,
        help="Rotating proxy URL (e.g. http://user:pass@ip:port)"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Print complete JSON verification report"
    )
    parser.add_argument(
        "--headed", action="store_true",
        help="Run browser in visible mode (default is headless)"
    )

    args = parser.parse_args()

    report = run_paraphraser(
        input_source=args.input,
        output_path=args.output,
        target_ai=args.target_ai,
        model=args.model,
        purpose=args.purpose,
        max_loops=args.max_loops,
        screenshots_dir=args.screenshots_dir,
        proxy=args.proxy,
        headless=not args.headed,
    )

    if args.json:
        print("\n" + json.dumps(report, indent=2))
    else:
        print("\n" + "=" * 50)
        print("         VERIFICATION REPORT SUMMARY")
        print("=" * 50)
        print(f"  Verdict:           {report['verdict']}")
        print(f"  Status:            {report['status']}")
        if report.get("final_verdict"):
            print(f"  ZeroGPT Verdict:   {report['final_verdict']}")
        if report.get("final_description"):
            print(f"  ZeroGPT Text:      {report['final_description']}")
        print(f"  Baseline AI Score: {report['baseline_ai_score']}%")
        print(f"  Final AI Score:    {report['final_ai_score']}%")
        print(f"  Final Human Style: {report['final_human_score']}%")
        print(f"  Iterations Ran:    {report['iterations_completed']}")
        print(f"  Screenshots Taken: {len(report['screenshots'])}")
        if report.get("output_file"):
            print(f"  Delivered File:    {report['output_file']}")


if __name__ == "__main__":
    main()
