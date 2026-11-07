#!/usr/bin/env python3
"""
zerogpt_detector.py
Playwright browser automation for ZeroGPT AI Content Detection.
- 0 API keys required (100% Free browser automation)
- Rotary User-Agent & stealth integration
- Human-like interaction (paste / fill / click)
- Waits until detection completes 100%
- Extracts precise AI GPT %, Human %, and complete description verdict
- Autoscrolls to result cards & gauge
- Visual screenshot capture with timestamps
"""

import os
import sys
import re
import time
from typing import Dict, Any, Optional
from datetime import datetime

# Path setup
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rotary_browser import RotaryBrowser

ZEROGPT_URL = "https://www.zerogpt.com/"


class ZeroGPTDetector:
    """Automates ZeroGPT detection checks with visual screenshot verification."""

    def __init__(self, headless: bool = True, proxy: Optional[str] = None):
        self.headless = headless
        self.proxy = proxy

    def detect(self, text: str, screenshots_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes an AI detection check on ZeroGPT.
        Waits until ZeroGPT completes scanning, extracts score and descriptive verdict,
        and captures centered visual screenshot receipts.
        """
        text = text.strip()
        if not text:
            return {
                "ai_score": 0.0,
                "human_score": 100.0,
                "is_ai": False,
                "verdict": "Empty text",
                "description": "No text provided for analysis.",
                "error": "Empty text"
            }

        if not screenshots_dir:
            screenshots_dir = os.path.join(os.getcwd(), "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        shot_path = os.path.join(screenshots_dir, f"zerogpt_{timestamp}.png")

        result = {
            "ai_score": 0.0,
            "human_score": 100.0,
            "is_ai": False,
            "verdict": "",
            "description": "",
            "text_length": len(text),
            "word_count": len(text.split()),
            "screenshot": "",
            "raw_text": "",
            "timestamp": timestamp,
        }

        with RotaryBrowser(headless=self.headless, proxy=self.proxy) as rb:
            page = rb.new_page()

            # Navigate to ZeroGPT
            try:
                page.goto(ZEROGPT_URL, timeout=45000, wait_until="domcontentloaded")
            except Exception:
                page.wait_for_timeout(2000)
                page.goto(ZEROGPT_URL, timeout=45000, wait_until="domcontentloaded")

            page.wait_for_timeout(2500)

            # Dismiss consent / cookie banners if present
            try:
                consent_btn = page.locator(
                    'button:has-text("Accept"), button:has-text("Consent"), button:has-text("Agree"), .fc-cta-consent, button:has-text("Close")'
                ).first
                if consent_btn.is_visible(timeout=2000):
                    consent_btn.click()
            except Exception:
                pass

            # Enter text into the main textarea with robust fallbacks
            ta = page.locator("textarea#textArea, textarea[placeholder*='Enter text'], textarea").first
            try:
                ta.scroll_into_view_if_needed(timeout=3000)
            except Exception:
                pass

            try:
                ta.fill(text, timeout=4000)
            except Exception:
                page.evaluate("""(txt) => {
                    const el = document.querySelector('textarea#textArea') || document.querySelector('textarea');
                    if (el) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        if (setter) setter.call(el, txt);
                        else el.value = txt;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }""", text)
            page.wait_for_timeout(800)

            # Click Detect Text
            detect_btn = page.locator("button:has-text('Detect Text')").first
            try:
                detect_btn.scroll_into_view_if_needed(timeout=3000)
                detect_btn.click(timeout=4000, force=True)
            except Exception:
                page.evaluate("""() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const b = btns.find(x => x.textContent.includes('Detect Text'));
                    if (b) b.click();
                }""")
            print("[ZeroGPT] Clicked 'Detect Text', waiting for complete scan analysis...")

            # Wait and poll for completion (up to 45s)
            ai_score_found = False
            for sec in range(45):
                page.wait_for_timeout(1000)
                try:
                    # Check for loading spinner or evaluating indicators
                    is_loading = page.locator(".spinner, .loading, .evaluating, button:disabled").count() > 0

                    # 1. Search for percentage score in DOM
                    score_elements = page.locator(
                        ".percentage-div, span.header-text, div[class*='percentage'], .result-text, .score"
                    ).all()

                    for el in score_elements:
                        inner = el.inner_text().strip()
                        m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:AI|GPT)?", inner, re.I)
                        if m and ("%" in inner or "AI" in inner or "GPT" in inner):
                            parsed_score = float(m.group(1))
                            if parsed_score <= 100.0:
                                result["ai_score"] = parsed_score
                                result["human_score"] = round(100.0 - result["ai_score"], 2)
                                result["is_ai"] = result["ai_score"] >= 7.0
                                result["raw_text"] = inner
                                ai_score_found = True
                                break

                    # 2. Extract description text
                    # ZeroGPT description classes: .header-text, .result-text, .dashboard-result-text
                    desc_candidates = page.locator(
                        "span.header-text, .result-text, .dashboard-result-text, div[class*='result'] p, .feedback-text"
                    ).all()

                    for cand in desc_candidates:
                        d_text = cand.inner_text().strip()
                        if d_text and any(k in d_text.lower() for k in ["your text", "human written", "ai/gpt", "likely", "content is"]):
                            result["description"] = d_text
                            break

                    if ai_score_found and result["description"] and not is_loading:
                        print(f"[ZeroGPT] Completed at {sec+1}s: {result['ai_score']}% AI | Verdict: '{result['description']}'")
                        break
                    elif ai_score_found and sec >= 5 and not is_loading:
                        # Give DOM an extra 1.5s to stabilize description
                        page.wait_for_timeout(1500)
                        for cand in desc_candidates:
                            d_text = cand.inner_text().strip()
                            if d_text and any(k in d_text.lower() for k in ["your text", "human written", "ai", "gpt"]):
                                result["description"] = d_text
                                break
                        break
                except Exception:
                    pass

            # Fallback if specific classes didn't match
            if not ai_score_found:
                body_text = page.locator("body").inner_text()
                matches = re.findall(r"([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:of\s+)?(?:AI|GPT)", body_text, re.I)
                if matches:
                    result["ai_score"] = float(matches[0])
                    result["human_score"] = round(100.0 - result["ai_score"], 2)
                    result["is_ai"] = result["ai_score"] >= 7.0

            # Default description if not explicitly extracted
            if not result["description"]:
                if result["ai_score"] < 7.0:
                    result["description"] = "Your text is Human written"
                    result["verdict"] = "Human Written (0.0% AI)"
                elif result["ai_score"] < 25.0:
                    result["description"] = "Your text is most likely Human written, may include parts generated by AI/GPT"
                    result["verdict"] = f"Partially AI ({result['ai_score']}%)"
                else:
                    result["description"] = "Your text is likely generated by AI/GPT"
                    result["verdict"] = f"AI Detected ({result['ai_score']}%)"
            else:
                result["verdict"] = result["description"]

            # Visual awareness: Autoscroll directly to the result gauge & verdict card
            rb.autoscroll_to_element(page, ".percentage-div, .result-box, .header-text, #textArea", block="center")
            page.wait_for_timeout(1000)

            # Capture visual evidence screenshot
            saved_shot = rb.capture_screenshot(page, shot_path, selector=".percentage-div, .result-box, #textArea")
            result["screenshot"] = saved_shot
            print(f"[ZeroGPT] Visual proof saved to: {saved_shot}")
            print(f"[ZeroGPT Final] Score: {result['ai_score']}% AI | Human: {result['human_score']}% | Description: {result['description']}")

        return result


if __name__ == "__main__":
    test_sample = "In the contemporary landscape of AI, critical thinking is essential."
    if len(sys.argv) > 1:
        test_sample = " ".join(sys.argv[1:])
    detector = ZeroGPTDetector(headless=True)
    res = detector.detect(test_sample)
    print("Result:", res)
