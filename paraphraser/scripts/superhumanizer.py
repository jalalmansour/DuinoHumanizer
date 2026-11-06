#!/usr/bin/env python3
"""
superhumanizer.py
Playwright browser automation for SuperHumanizer.ai.
- 0 API keys required (100% Free browser automation)
- Rotary User-Agent & stealth integration
- Human-like copy/paste clipboard interaction
- Mode selection: 'Super Lite' or 'Super Ultra'
- Network response interceptor for reliable text extraction
- Autoscroll to result container with screenshot evidence
"""

import os
import sys
import time
from typing import Dict, Any, Optional
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rotary_browser import RotaryBrowser

SUPERHUMANIZER_URL = "https://superhumanizer.ai/"


class SuperHumanizer:
    """Automates SuperHumanizer.ai transformation with visual proof."""

    def __init__(self, headless: bool = True, proxy: Optional[str] = None):
        self.headless = headless
        self.proxy = proxy

    def humanize(
        self,
        text: str,
        mode: str = "Super Lite",
        screenshots_dir: Optional[str] = None,
        timeout_seconds: int = 35
    ) -> Dict[str, Any]:
        """
        Submits text to SuperHumanizer.ai, autoscrolls, captures screenshot, and returns humanized text.
        """
        text = text.strip()
        if not text:
            return {"humanized_text": "", "success": False, "error": "Empty text"}

        if not screenshots_dir:
            screenshots_dir = os.path.join(os.getcwd(), "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        shot_path = os.path.join(screenshots_dir, f"superhumanizer_{timestamp}.png")

        result = {
            "humanized_text": "",
            "mode": mode,
            "success": False,
            "original_length": len(text),
            "humanized_length": 0,
            "screenshot": "",
            "timestamp": timestamp,
        }

        with RotaryBrowser(headless=self.headless, proxy=self.proxy) as rb:
            page = rb.new_page()

            # Network listener to capture the exact humanized payload
            captured_from_api = []

            def on_response(res):
                try:
                    if "/api/humanize" in res.url and res.status == 200:
                        data = res.json()
                        if isinstance(data, dict) and "humanizedText" in data:
                            captured_from_api.append(data["humanizedText"])
                except Exception:
                    pass

            page.on("response", on_response)

            print(f"[SuperHumanizer] Navigating to {SUPERHUMANIZER_URL}...")
            try:
                page.goto(SUPERHUMANIZER_URL, timeout=45000, wait_until="domcontentloaded")
            except Exception:
                page.wait_for_timeout(2000)
                page.goto(SUPERHUMANIZER_URL, timeout=45000, wait_until="domcontentloaded")

            page.wait_for_timeout(3000)

            # Select mode if requested ("Super Lite" or "Super Ultra")
            if mode:
                try:
                    mode_btn = page.locator(f"button:has-text('{mode}')").first
                    if mode_btn.is_visible(timeout=2000):
                        mode_btn.click()
                        page.wait_for_timeout(500)
                except Exception:
                    pass

            # Method 1: Emulate human clipboard paste via 'Paste Text' button
            pasted = False
            try:
                page.evaluate("(txt) => navigator.clipboard.writeText(txt)", text)
                paste_btn = page.locator("button:has-text('Paste Text')").first
                if paste_btn.is_visible(timeout=3000):
                    paste_btn.click()
                    page.wait_for_timeout(1000)
                    pasted = True
                    print("[SuperHumanizer] Human-like clipboard paste successful.")
            except Exception:
                pasted = False

            # Method 2 fallback: Native React setter + input event dispatch
            if not pasted:
                page.evaluate("""(txt) => {
                    const ta = document.querySelector('textarea');
                    if (ta) {
                        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        setter.call(ta, txt);
                        ta.dispatchEvent(new Event('input', { bubbles: true }));
                        ta.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }""", text)
                page.wait_for_timeout(1000)

            # Locate and click Humanize button
            humanize_btn = page.locator("button:has-text('Humanize')").first
            humanize_btn.scroll_into_view_if_needed()
            page.wait_for_timeout(500)

            # Wait until enabled if necessary
            for _ in range(5):
                if not humanize_btn.is_disabled():
                    break
                page.wait_for_timeout(800)

            humanize_btn.click(force=True)
            print("[SuperHumanizer] Clicked 'Humanize', awaiting output...")

            # Wait for either API payload interception or DOM update
            start_wait = time.time()
            extracted_text = ""

            while time.time() - start_wait < timeout_seconds:
                page.wait_for_timeout(1000)

                # Check intercepted API response first
                if captured_from_api:
                    extracted_text = captured_from_api[-1]
                    print("[SuperHumanizer] Captured humanized text via network interceptor.")
                    break

                # Check second textarea
                try:
                    tas = page.locator("textarea").all()
                    if len(tas) > 1:
                        val = tas[1].input_value().strip()
                        if val and len(val) > 15 and val != text:
                            extracted_text = val
                            print("[SuperHumanizer] Captured humanized text from output textarea.")
                            break
                except Exception:
                    pass

                # Check copy button presence
                try:
                    copy_btn = page.locator("button:has-text('Copy')").first
                    if copy_btn.is_visible(timeout=500):
                        # Output is ready
                        page.wait_for_timeout(1000)
                        if captured_from_api:
                            extracted_text = captured_from_api[-1]
                            break
                except Exception:
                    pass

            if extracted_text:
                result["humanized_text"] = extracted_text
                result["humanized_length"] = len(extracted_text)
                result["success"] = True

            # Visual awareness: Autoscroll to the output container / copy button
            rb.autoscroll_to_element(page, "button:has-text('Copy'), div[class*='output'], textarea", block="center")
            page.wait_for_timeout(800)

            # Capture visual screenshot
            saved_shot = rb.capture_screenshot(page, shot_path, selector="button:has-text('Copy'), textarea")
            result["screenshot"] = saved_shot
            print(f"[SuperHumanizer] Visual screenshot saved to: {saved_shot}")

        return result


if __name__ == "__main__":
    sample = "In the contemporary landscape of AI, large language models play a pivotal role."
    sh = SuperHumanizer(headless=True)
    res = sh.humanize(sample)
    print("Result:", res)
