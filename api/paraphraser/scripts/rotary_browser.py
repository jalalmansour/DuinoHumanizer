#!/usr/bin/env python3
"""
rotary_browser.py
Rotary Stealth Browser Manager for Paraphraser & Duino Deep Researcher.
Features:
- Rotary User-Agent pool (Modern Windows, macOS, Linux desktop browsers)
- Rotary / Proxy support (HTTP/SOCKS5)
- Anti-detection stealth scripts (navigator.webdriver bypass, Chrome runtime emulation)
- Visual awareness: Autoscrolls elements into view before capturing screenshots
- Bulletproof screenshot engine (CDP raster capture fallback to prevent webfont timeouts)
- 0 API Keys required (100% Free Playwright automation)
"""

import os
import sys
import random
import base64
import time
from typing import Optional, Dict, Any, Tuple
from pathlib import Path

# Ensure Playwright browser binary path is configured
PLAYWRIGHT_PATH = os.environ.get(
    "PLAYWRIGHT_BROWSERS_PATH",
    os.path.join(os.path.dirname(sys.executable), "playwright-browsers")
)
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = PLAYWRIGHT_PATH

from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext

# Rotary Desktop User-Agent pool
ROTARY_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
]

VIEWPORTS = [
    {"width": 1920, "height": 1080},
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},
    {"width": 1366, "height": 768},
]


class RotaryBrowser:
    """Manages stealth browser sessions with rotation, autoscroll, and visual capture."""

    def __init__(self, headless: bool = True, proxy: Optional[str] = None):
        self.headless = headless
        self.proxy = proxy or os.environ.get("ROTARY_PROXY") or os.environ.get("HTTP_PROXY")
        self._pw = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def start(self):
        self._pw = sync_playwright().start()
        launch_args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-infobars",
            "--window-position=0,0",
            "--ignore-certificate-errors",
            "--ignore-certificate-errors-spki-list",
        ]
        proxy_config = {"server": self.proxy} if self.proxy else None

        self.browser = self._pw.chromium.launch(
            headless=self.headless,
            args=launch_args,
            proxy=proxy_config,
        )

    def new_page(self) -> Page:
        if not self.browser:
            self.start()

        ua = random.choice(ROTARY_USER_AGENTS)
        vp = random.choice(VIEWPORTS)

        self.context = self.browser.new_context(
            user_agent=ua,
            viewport=vp,
            locale="en-US",
            timezone_id="America/New_York",
            permissions=["clipboard-read", "clipboard-write"],
        )

        page = self.context.new_page()

        # Inject stealth scripts to mask automation and headless fingerprints
        page.add_init_script("""
            // Override webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            // Chrome runtime stub
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };

            // Fake plugins & languages
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });

            // Headless & Fingerprint Spoofing (WebGL / Canvas noise)
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(param) {
                if (param === 37445) return 'Intel Inc.';
                if (param === 37446) return 'Intel(R) Iris(R) Xe Graphics';
                return getParameter.apply(this, arguments);
            };
        """)

        # Abort slow webfonts to avoid font loading timeouts during rendering
        page.route("**/*.{woff,woff2,ttf,otf}", lambda route: route.abort())

        return page

    def reset_session(self, page: Page):
        """Wipes cookies, storage, and resets browser context to cycle identity / bypass rate limits."""
        try:
            if self.context:
                self.context.clear_cookies()
            page.evaluate("""() => {
                try { localStorage.clear(); } catch(e){}
                try { sessionStorage.clear(); } catch(e){}
            }""")
        except Exception:
            pass

    @staticmethod
    def autoscroll_to_element(page: Page, selector: str, block: str = "center") -> bool:
        """Autoscrolls the page smoothly or instantly so the element is prominently in view."""
        try:
            loc = page.locator(selector).first
            if loc.count() > 0:
                loc.scroll_into_view_if_needed(timeout=5000)
                page.wait_for_timeout(600)
                return True
        except Exception:
            pass

        # Fallback evaluate scroll
        try:
            page.evaluate(f"""(sel) => {{
                const el = document.querySelector(sel);
                if (el) {{
                    el.scrollIntoView({{ behavior: 'instant', block: '{block}' }});
                }}
            }}""", selector)
            page.wait_for_timeout(600)
            return True
        except Exception:
            return False

    @staticmethod
    def capture_screenshot(page: Page, output_path: str, selector: Optional[str] = None) -> str:
        """
        Visual awareness capture: autoscrolls to target element and saves screenshot.
        Uses CDP raster fallback if standard screenshot encounters font or animation locks.
        """
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        if selector:
            RotaryBrowser.autoscroll_to_element(page, selector)

        # Attempt 1: Standard Playwright screenshot with timeout
        try:
            page.screenshot(path=output_path, timeout=5000, animations="disabled")
            return output_path
        except Exception:
            pass

        # Attempt 2: CDP direct raster capture (bypasses all font/stylesheet locks)
        try:
            cdp = page.context.new_cdp_session(page)
            res = cdp.send("Page.captureScreenshot", {"format": "png"})
            data = base64.b64decode(res["data"])
            with open(output_path, "wb") as f:
                f.write(data)
            return output_path
        except Exception as e:
            print(f"[Warning] Screenshot capture failed: {e}")
            return ""

    def close(self):
        if self.context:
            try:
                self.context.close()
            except Exception:
                pass
        if self.browser:
            try:
                self.browser.close()
            except Exception:
                pass
        if self._pw:
            try:
                self._pw.stop()
            except Exception:
                pass
