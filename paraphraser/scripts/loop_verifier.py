#!/usr/bin/env python3
"""
loop_verifier.py
Loop Engineering & Maker/Checker Verification Engine for Paraphraser.
Enforces the quality gate:
- AI GPT Score: < 7.0%
- Human Written Style: > 93.0%
- 0 API Keys, 100% Free Playwright automation
- Rotary browser, stealth flags, autoscroll screenshots
- Complete ZeroGPT descriptive verdict extraction
"""

import os
import sys
import re
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zerogpt_detector import ZeroGPTDetector
from superhumanizer import SuperHumanizer
from text_normalizer import TextNormalizer

# AI Slop and Cliché replacements for adversarial mutation
AI_CLICHE_PATTERNS = [
    (r"\bIn the contemporary landscape of\b", "In today's"),
    (r"\bIt is crucial to recognize that\b", ""),
    (r"\bplays? a pivotal role in\b", "is key to"),
    (r"\bserves as a testament to\b", "demonstrates"),
    (r"\bunderscoring the delicate balance between\b", "balancing"),
    (r"\bacross diverse domains\b", "in many fields"),
    (r"\bfurthermore,\s*", "Also, "),
    (r"\bmoreover,\s*", "Plus, "),
    (r"\bin order to\b", "to"),
    (r"\bdue to the fact that\b", "because"),
    (r"\ba wide array of\b", "many"),
    (r"\bdelve into\b", "look into"),
    (r"\bharness the power of\b", "use"),
    (r"\bnavigating the complexities of\b", "handling"),
    (r"\bvibrant tapestry\b", "mix"),
    (r"\bseamless integration\b", "smooth fit"),
]


class LoopParaphraseEngine:
    """
    Closed-loop iterative paraphraser and verifier.
    Maker: Preprocessing + SuperHumanizer.ai
    Checker: ZeroGPT Detector
    Gate: AI Score < 7.0% | Human Score > 93.0%
    """

    def __init__(
        self,
        headless: bool = True,
        max_loops: int = 4,
        target_max_ai: float = 7.0,
        model: str = "Super Ultra",
        purpose: str = "Academic",
        screenshots_dir: Optional[str] = None,
        proxy: Optional[str] = None,
    ):
        self.headless = headless
        self.max_loops = max_loops
        self.target_max_ai = target_max_ai
        self.model = model or "Super Ultra"
        self.purpose = purpose or "Academic"
        self.screenshots_dir = screenshots_dir or os.path.join(os.getcwd(), "screenshots")
        self.proxy = proxy

        os.makedirs(self.screenshots_dir, exist_ok=True)
        self.superhumanizer = SuperHumanizer(headless=self.headless, proxy=self.proxy)
        self.detector = ZeroGPTDetector(headless=self.headless, proxy=self.proxy)

    def clean_slop(self, text: str) -> str:
        """Lightweight pre-filter to break predictable AI ngram patterns."""
        cleaned = text
        for pat, repl in AI_CLICHE_PATTERNS:
            cleaned = re.sub(pat, repl, cleaned, flags=re.I)
        # Normalize double spaces and punctuation
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        cleaned = re.sub(r"\s+([.,!?;:])", r"\1", cleaned)
        return cleaned

    def apply_adversarial_mutation(self, text: str, iteration: int) -> str:
        """
        Adversarially breaks AI sentence cadence and perplexity when a check fails.
        Varies sentence lengths, merges or fragments clauses, and injects burstiness.
        """
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        if len(sentences) <= 1:
            return self.clean_slop(text)

        mutated = []
        for i, s in enumerate(sentences):
            s = self.clean_slop(s)
            # Inject burstiness: alternate between punchy short and structured compound
            if i % 3 == 0 and len(s.split()) > 18:
                parts = re.split(r",\s+(?:and|which|while|whereas)\s+", s, maxsplit=1)
                if len(parts) == 2:
                    mutated.append(parts[0].strip() + ".")
                    mutated.append(parts[1].capitalize().strip())
                    continue
            mutated.append(s)

        res = " ".join(mutated)
        return res

    def run(self, input_text: str) -> Dict[str, Any]:
        """
        Sanitizes text and executes Loop Verification with 1,200 words max chunking.
        """
        # 1. Apply Universal Normalization & Sanitization Pipeline
        sanitized = TextNormalizer.sanitize(input_text)
        word_count = len(sanitized.split())

        # If text is within 1,200 words limit, run single pass
        if word_count <= 1200:
            return self._run_single_chunk(sanitized)

        # Otherwise, split into semantic chunks of <= 1,200 words
        print(f"\n[Chunking Engine] Text has {word_count:,} words (> 1,200). Partitioning into 1,200-word chunks...")
        chunks = TextNormalizer.chunk_text(sanitized, max_words=1200)
        print(f"[Chunking Engine] Created {len(chunks)} chunk(s) for loop verification.")

        combined_texts = []
        all_screenshots = []
        all_history = []
        baseline_scores = []
        final_scores = []
        final_verdicts = []
        start_time = time.time()

        for c in chunks:
            print(f"\n>>> PROCESSING CHUNK {c['index']}/{len(chunks)} ({c['word_count']} words) <<<")
            c_res = self._run_single_chunk(c["text"])
            combined_texts.append(c_res.get("final_text", c["text"]))
            if c_res.get("screenshots"):
                all_screenshots.extend(c_res["screenshots"])
            if c_res.get("history"):
                all_history.extend(c_res["history"])
            if c_res.get("baseline_ai_score") is not None:
                baseline_scores.append(c_res["baseline_ai_score"])
            if c_res.get("final_ai_score") is not None:
                final_scores.append(c_res["final_ai_score"])
            final_verdicts.append(c_res.get("final_verdict", "Human Written"))

        avg_baseline = round(sum(baseline_scores) / len(baseline_scores), 2) if baseline_scores else 0.0
        avg_final = round(sum(final_scores) / len(final_scores), 2) if final_scores else 0.0
        overall_human = round(max(0.0, 100.0 - avg_final), 2)

        return {
            "status": "PASSED" if avg_final < self.target_max_ai else "COMPLETED",
            "verdict": "APPROVE" if avg_final < self.target_max_ai else "REVIEW",
            "final_verdict": "Human Written" if avg_final < self.target_max_ai else "Partially Humanized",
            "final_description": f"Multi-chunk verification completed across {len(chunks)} chunks (Average AI: {avg_final}%)",
            "baseline_description": f"Initial scan across {len(chunks)} chunks (Average AI: {avg_baseline}%)",
            "iterations_completed": len(chunks),
            "target_max_ai": self.target_max_ai,
            "target_min_human": round(100.0 - self.target_max_ai, 2),
            "baseline_ai_score": avg_baseline,
            "baseline_human_score": round(max(0.0, 100.0 - avg_baseline), 2),
            "final_ai_score": avg_final,
            "final_human_score": overall_human,
            "original_text": sanitized,
            "final_text": "\n\n".join(combined_texts),
            "history": all_history,
            "screenshots": all_screenshots,
            "elapsed_seconds": round(time.time() - start_time, 2),
        }

    def _run_single_chunk(self, input_text: str) -> Dict[str, Any]:
        """
        Executes the full Loop Verification process on a single chunk (<= 1,200 words).
        """
        start_time = time.time()
        input_text = input_text.strip()

        report = {
            "status": "RUNNING",
            "verdict": "REJECT",
            "final_verdict": "",
            "final_description": "",
            "baseline_description": "",
            "iterations_completed": 0,
            "target_max_ai": self.target_max_ai,
            "target_min_human": round(100.0 - self.target_max_ai, 2),
            "baseline_ai_score": None,
            "baseline_human_score": None,
            "final_ai_score": None,
            "final_human_score": None,
            "original_text": input_text,
            "final_text": input_text,
            "history": [],
            "screenshots": [],
            "elapsed_seconds": 0,
        }

        print("=" * 70)
        print("  PARAPHRASER: LOOP ENGINEERING & VERIFICATION ENGINE")
        print(f"  Model: {self.model} | Purpose: {self.purpose}")
        print(f"  Quality Gate: AI < {self.target_max_ai}% | Human > {report['target_min_human']}%")
        print("=" * 70)

        # Step 0: Baseline ZeroGPT Check
        print("\n[Phase 0] Checking baseline input on ZeroGPT...")
        base_check = self.detector.detect(input_text, screenshots_dir=self.screenshots_dir)
        report["baseline_ai_score"] = base_check["ai_score"]
        report["baseline_human_score"] = base_check["human_score"]
        report["baseline_description"] = base_check.get("description", "")
        if base_check.get("screenshot"):
            report["screenshots"].append(base_check["screenshot"])

        print(f"[Baseline] AI GPT: {base_check['ai_score']}% | Human: {base_check['human_score']}%")
        if base_check.get("description"):
            print(f"[Baseline Description] {base_check['description']}")

        # Fast pass: If already < 7% AI, approve directly!
        if base_check["ai_score"] < self.target_max_ai:
            print("[Verdict] Input already meets threshold (< 7% AI). APPROVE.")
            report["verdict"] = "APPROVE"
            report["status"] = "PASSED"
            report["final_verdict"] = base_check.get("verdict", "Human Written")
            report["final_description"] = base_check.get("description", "Your text is Human written")
            report["final_ai_score"] = base_check["ai_score"]
            report["final_human_score"] = base_check["human_score"]
            report["elapsed_seconds"] = round(time.time() - start_time, 2)
            return report

        # Loop Iterations
        current_candidate = input_text
        best_candidate = input_text
        best_ai_score = base_check["ai_score"]
        best_human_score = base_check["human_score"]
        best_verdict = base_check.get("verdict", "")
        best_desc = base_check.get("description", "")

        loop_idx = 0
        is_limitless = (self.max_loops == 0)
        # Limitless runs until quality gate passes, with safety threshold of 50
        max_iterations = 50 if is_limitless else max(1, self.max_loops)

        while loop_idx < max_iterations:
            loop_idx += 1
            report["iterations_completed"] = loop_idx
            loop_tag = f"LIMITLESS LOOP #{loop_idx} (Target: <{self.target_max_ai}% AI)" if is_limitless else f"LOOP ITERATION {loop_idx}/{self.max_loops}"
            print(f"\n--- {loop_tag} ---")

            # 1. Clean slop and prepare input
            prep_text = self.clean_slop(current_candidate)
            if loop_idx > 1:
                prep_text = self.apply_adversarial_mutation(prep_text, loop_idx)

            # 2. Select mode: Alternate between requested model and Lite on failure
            mode = self.model if loop_idx % 2 == 1 else "Super Lite"
            print(f"[Maker] Running SuperHumanizer.ai (Mode: {mode})...")

            humanize_res = self.superhumanizer.humanize(
                prep_text,
                mode=mode,
                screenshots_dir=self.screenshots_dir,
            )
            if humanize_res.get("screenshot"):
                report["screenshots"].append(humanize_res["screenshot"])

            candidate_text = humanize_res["humanized_text"] or prep_text

            # 3. Checker Phase: Verify on ZeroGPT
            print(f"[Checker] Verifying candidate on ZeroGPT...")
            verify_res = self.detector.detect(
                candidate_text,
                screenshots_dir=self.screenshots_dir,
            )
            if verify_res.get("screenshot"):
                report["screenshots"].append(verify_res["screenshot"])

            ai_score = verify_res["ai_score"]
            human_score = verify_res["human_score"]
            verdict_text = verify_res.get("verdict", "")
            desc_text = verify_res.get("description", "")

            iter_record = {
                "iteration": loop_idx,
                "mode": mode,
                "ai_score": ai_score,
                "human_score": human_score,
                "verdict": verdict_text,
                "description": desc_text,
                "passed_gate": ai_score < self.target_max_ai,
                "candidate_sample": candidate_text[:120] + "...",
            }
            report["history"].append(iter_record)

            print(f"[Iteration {loop_idx} Result] AI Score: {ai_score}% | Human Score: {human_score}%")
            if desc_text:
                print(f"[Iteration {loop_idx} Description] {desc_text}")

            # Track best result
            if ai_score < best_ai_score:
                best_ai_score = ai_score
                best_human_score = human_score
                best_candidate = candidate_text
                best_verdict = verdict_text
                best_desc = desc_text

            # 4. Gate Evaluation (Loop Verifier)
            if ai_score < self.target_max_ai:
                print(f"\n>>> QUALITY GATE PASSED: AI Score {ai_score}% < {self.target_max_ai}% <<<")
                report["verdict"] = "APPROVE"
                report["status"] = "PASSED"
                report["final_verdict"] = verdict_text or "Human Written (0.0% AI)"
                report["final_description"] = desc_text or "Your text is Human written"
                report["final_text"] = candidate_text
                report["final_ai_score"] = ai_score
                report["final_human_score"] = human_score
                break
            else:
                print(f"[Loop Verifier REJECT] AI Score {ai_score}% >= {self.target_max_ai}%. Triggering adversarial mutation...")
                current_candidate = candidate_text

        # If loops exhausted without passing gate, report best candidate
        if report["verdict"] != "APPROVE":
            report["final_text"] = best_candidate
            report["final_ai_score"] = best_ai_score
            report["final_human_score"] = best_human_score
            report["final_verdict"] = best_verdict or f"AI Detected ({best_ai_score}%)"
            report["final_description"] = best_desc or f"Best score reached: {best_ai_score}% AI"
            report["status"] = "EXHAUSTED"
            print(f"\n[Notice] Max loops completed. Best AI score achieved: {best_ai_score}%")

        report["elapsed_seconds"] = round(time.time() - start_time, 2)
        return report


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Duino Humanizer Playwright Closed-Loop Verifier")
    parser.add_argument("--text", type=str, default="", help="Text to humanize and verify")
    parser.add_argument("--file", type=str, default="", help="Path to input file")
    parser.add_argument("--max-loops", type=int, default=15, help="Maximum loops (0 for limitless)")
    parser.add_argument("--target-ai", type=float, default=7.0, help="Target maximum AI score")
    parser.add_argument("--model", type=str, default="Super Ultra", help="Model name")
    parser.add_argument("--purpose", type=str, default="Academic", help="Optimization style")
    parser.add_argument("--headless", action="store_true", default=True, help="Run headless browser")
    parser.add_argument("--no-headless", dest="headless", action="store_false", help="Run headful browser")
    parser.add_argument("--json", action="store_true", help="Print only JSON to stdout")

    args = parser.parse_args()

    input_text = args.text
    if args.file and os.path.exists(args.file):
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                input_text = f.read()
        except Exception as e:
            if not args.json:
                print(f"Failed to read file: {e}")

    if not input_text:
        input_text = (
            "In the contemporary landscape of artificial intelligence, it is crucial to recognize "
            "that large language models play a pivotal role in revolutionizing modern workflows."
        )

    engine = LoopParaphraseEngine(
        headless=args.headless,
        max_loops=args.max_loops,
        target_max_ai=args.target_ai,
        model=args.model,
        purpose=args.purpose
    )
    res = engine.run(input_text)
    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print("\nFINAL REPORT:\n", json.dumps(res, indent=2))
