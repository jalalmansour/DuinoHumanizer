#!/usr/bin/env python3
"""
test_playwright_workflow.py
End-to-End Playwright Workflow Automation Suite for Checker PRO (Duino Humanizer).
Validates:
1. License Agreement & EULA Acceptance UI
2. 5-Step Component Installation Process with live progress bar
3. Humanizer Studio Tab (Ingestion & Controls)
4. Multi-File Batch Queue Tab (Word counts & layout anchors)
5. Side-by-Side Layout Diff Tab
6. Verification Proof Gallery Tab
7. Legal & License Agreement Tab
8. Graphical Uninstallation UI with removal progress & completion
Captures full-page screenshots at each milestone.
"""

import os
import sys
import time
import json
import subprocess
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

HERE = Path(__file__).resolve().parent
SCREENSHOTS_DIR = HERE / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

PYTHON_EXE = r"C:\Users\jalal\AppData\Local\Programs\Python\Python311\python.exe"
if not os.path.exists(PYTHON_EXE):
    PYTHON_EXE = sys.executable

TEST_PORT = 8522


def start_backend():
    print(f"[Backend] Launching server.py on port {TEST_PORT} with --setup mode...")
    p = subprocess.Popen([
        PYTHON_EXE,
        str(HERE / "server.py"),
        "--port", str(TEST_PORT),
        "--setup"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Wait for status 200
    for _ in range(30):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/api/status", timeout=2) as resp:
                if resp.status == 200:
                    print(f"[Backend] Server responsive at http://127.0.0.1:{TEST_PORT}")
                    return p
        except Exception:
            pass

    p.kill()
    raise RuntimeError("Backend server failed to start within 15 seconds")


def run_workflow_test():
    server_process = start_backend()

    try:
        with sync_playwright() as p:
            print("\n[Playwright] Launching browser engine...")
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 920})
            page = context.new_page()
            page.set_default_timeout(45000)
            page.set_default_navigation_timeout(45000)
            page.on("console", lambda msg: print(f"  [Console] {msg.text}"))
            page.on("pageerror", lambda err: print(f"  [PageError] {err}"))

            # -------------------------------------------------------------
            # STAGE 1: EULA & License Agreement Acceptance Screen
            # -------------------------------------------------------------
            print("\n[Stage 1/8] Testing EULA & License Agreement Acceptance UI...")
            page.goto(f"http://127.0.0.1:{TEST_PORT}?setup=1")
            page.wait_for_selector(".installer-title", timeout=45000)

            # Check title and EULA box
            assert page.locator(".installer-title:has-text('License Agreement')").is_visible(), "License Agreement title not visible"
            assert page.locator(".eula-box").is_visible(), "EULA box not visible"
            print("  [OK] License Agreement header and charter visible.")

            # Button should initially be disabled until checkbox is checked
            accept_btn = page.locator("button:has-text('Accept & Start Installation')")
            assert accept_btn.is_disabled(), "Accept button should be disabled before checking agreement"
            print("  [OK] Accept button properly disabled prior to agreement confirmation.")

            shot1 = str(SCREENSHOTS_DIR / "workflow_01_license_agreement.png")
            page.screenshot(path=shot1)
            print(f"  [Proof] Screenshot captured: {shot1}")

            # Check agreement checkbox
            checkbox = page.locator("input[type='checkbox']").first
            checkbox.check()
            page.wait_for_timeout(500)
            assert accept_btn.is_enabled(), "Accept button should be enabled after checking agreement"
            print("  [OK] Agreement checked; button enabled.")

            # -------------------------------------------------------------
            # STAGE 2: 5-Step Automated Component Installation Process
            # -------------------------------------------------------------
            print("\n[Stage 2/8] Testing 5-Step Installation Process...")
            accept_btn.click()
            page.wait_for_selector(".installer-title:has-text('Setup & Installation')", timeout=20000)

            # Check that installation process view is active
            assert page.locator(".installer-title:has-text('Setup & Installation')").is_visible(), "Installation process title not visible"
            assert page.locator(".installer-steps-list").is_visible(), "Installer steps list not visible"

            shot2 = str(SCREENSHOTS_DIR / "workflow_02_installation_running.png")
            page.screenshot(path=shot2)
            print(f"  [Proof] Screenshot captured: {shot2}")

            # Wait for all 5 steps to complete
            print("  [Wait] Waiting for all 5 installation steps to complete...")
            page.wait_for_selector("button:has-text('Launch Duino Humanizer')", timeout=45000)
            print("  [OK] 5 installation steps completed (100% progress)!")

            shot3 = str(SCREENSHOTS_DIR / "workflow_03_installation_completed.png")
            page.screenshot(path=shot3)
            print(f"  [Proof] Screenshot captured: {shot3}")

            # Transition into Humanizer Studio
            page.locator("button:has-text('Launch Duino Humanizer')").click()
            page.wait_for_selector(".page-title:has-text('Humanizer Studio')", timeout=20000)

            # -------------------------------------------------------------
            # STAGE 3: Tab 1 - Humanizer Studio View (Both Possibilities)
            # -------------------------------------------------------------
            print("\n[Stage 3/8] Testing Tab 1: Humanizer Studio (Split Text & File Batch Modes)...")
            assert page.locator(".page-title:has-text('Humanizer Studio')").is_visible(), "Humanizer Studio title not visible"

            # Possibility 1: Live Text & Email Split Studio
            print("  [Mode 1] Testing Live Text & Email Split Studio...")
            assert page.locator("text=Original Text / Email Input").is_visible()
            assert page.locator("text=Humanized Output").is_visible()
            assert page.locator("button:has-text('Copy Output')").is_visible()
            assert page.locator("button:has-text('DOCX')").is_visible()
            assert page.locator("button:has-text('PDF')").is_visible()
            assert page.locator("button:has-text('TXT')").is_visible()

            # Input dirty text with invisible chars, smart quotes, em dashes, emojis
            sample_text = "INTRODUCTION\u200b\n“Artificial Intelligence” in modern workflows — an essential paradigm… 🚀"
            textarea = page.locator("textarea.editor-textarea").first
            textarea.fill(sample_text)
            page.wait_for_timeout(300)

            # Test Sanitize & Format button
            page.locator("button:has-text('Sanitize & Format')").click()
            page.wait_for_timeout(500)
            cleaned_val = textarea.input_value()
            assert "“" not in cleaned_val and "—" not in cleaned_val and "🚀" not in cleaned_val
            print("  [OK] Universal Text Sanitization pipeline verified in Live Split Studio.")

            shot4 = str(SCREENSHOTS_DIR / "workflow_04_split_studio.png")
            page.screenshot(path=shot4)
            print(f"  [Proof] Screenshot captured: {shot4}")

            # Possibility 2: Document Batch Ingestion Mode
            print("  [Mode 2] Switching to Document Batch Ingestion Mode...")
            page.locator("button:has-text('Document Batch Mode')").click()
            page.wait_for_selector(".dropzone", timeout=5000)
            assert page.locator(".dropzone").is_visible(), "File dropzone not visible"
            assert page.locator("text=Direct File Path Ingestion").is_visible(), "Path ingestion not visible"

            # Ingest a sample file via manual path input
            sample_file = str(HERE / "samples" / "Edgar Allan Poe.docx")
            path_input = page.locator("input.text-input")
            path_input.fill(sample_file)
            page.wait_for_timeout(400)
            path_input.press("Enter")
            page.wait_for_selector("text=Edgar Allan Poe.docx", timeout=25000)

            # Check table headers in Studio
            assert page.locator("th:has-text('Document Name')").is_visible()
            assert page.locator("th:has-text('Anchors Detected')").is_visible()
            assert page.locator("th:has-text('Words')").is_visible()
            assert page.locator(".badge-docx").is_visible(), "DOCX extension badge with icon not visible"

            shot4_batch = str(SCREENSHOTS_DIR / "workflow_04_humanizer_studio.png")
            page.screenshot(path=shot4_batch)
            print(f"  [Proof] Screenshot captured: {shot4_batch}")
            print("  [OK] Humanizer Studio verified in both Split and Batch modes with extension icons.")

            # -------------------------------------------------------------
            # STAGE 4: Tab 2 - Multi-File Batch Queue View
            # -------------------------------------------------------------
            print("\n[Stage 4/8] Testing Tab 2: Multi-File Batch Queue...")
            page.locator("button.nav-item:has-text('Multi-File Batch Queue')").click()
            page.wait_for_selector(".page-title:has-text('Multi-File Batch Queue')", timeout=10000)

            assert page.locator(".page-title:has-text('Multi-File Batch Queue')").is_visible()
            assert page.locator("text=Batch Execution Engine").is_visible()
            assert page.locator("text=Baseline AI Score").is_visible()
            assert page.locator("text=Final AI Score").is_visible()

            shot5 = str(SCREENSHOTS_DIR / "workflow_05_batch_queue.png")
            page.screenshot(path=shot5)
            print(f"  [Proof] Screenshot captured: {shot5}")
            print("  [OK] Multi-File Batch Queue engine & KPI metrics verified.")

            # -------------------------------------------------------------
            # STAGE 5: Tab 3 - Side-by-Side Layout Diff View
            # -------------------------------------------------------------
            print("\n[Stage 5/8] Testing Tab 3: Side-by-Side Layout Diff...")
            page.locator("button.nav-item:has-text('Side-by-Side Layout Diff')").click()
            page.wait_for_selector(".page-title:has-text('Side-by-Side Layout Diff')", timeout=10000)

            assert page.locator(".page-title:has-text('Side-by-Side Layout Diff')").is_visible()

            shot6 = str(SCREENSHOTS_DIR / "workflow_06_layout_diff.png")
            page.screenshot(path=shot6)
            print(f"  [Proof] Screenshot captured: {shot6}")
            print("  [OK] Side-by-Side Layout Diff view verified.")

            # -------------------------------------------------------------
            # STAGE 6: Tab 4 - Verification Proof Gallery View
            # -------------------------------------------------------------
            print("\n[Stage 6/8] Testing Tab 4: Verification Proof Gallery...")
            page.locator("button.nav-item:has-text('Verification Proof Gallery')").click()
            page.wait_for_selector(".page-title:has-text('Verification Proof Gallery')", timeout=10000)

            assert page.locator(".page-title:has-text('Verification Proof Gallery')").is_visible()

            shot7 = str(SCREENSHOTS_DIR / "workflow_07_proof_gallery.png")
            page.screenshot(path=shot7)
            print(f"  [Proof] Screenshot captured: {shot7}")
            print("  [OK] Verification Proof Gallery verified.")

            # -------------------------------------------------------------
            # STAGE 7: Tab 5 - Legal & License Agreement View
            # -------------------------------------------------------------
            print("\n[Stage 7/8] Testing Tab 5: Legal & License Agreement...")
            page.locator("button.nav-item:has-text('Legal & License Agreement')").click()
            page.wait_for_selector(".page-title:has-text('Legal & License Agreement')", timeout=10000)

            assert page.locator(".page-title:has-text('Legal & License Agreement')").is_visible()
            assert page.locator("text=J.D | Duino Inc").first.is_visible()
            assert page.locator("text=Jalal").first.is_visible()

            shot8 = str(SCREENSHOTS_DIR / "workflow_08_legal_agreement.png")
            page.screenshot(path=shot8)
            print(f"  [Proof] Screenshot captured: {shot8}")
            print("  [OK] Legal Agreement & Developer Attribution (Jalal | J.D | Duino Inc) verified.")

            # -------------------------------------------------------------
            # STAGE 8: Uninstallation UI Flow
            # -------------------------------------------------------------
            print("\n[Stage 8/8] Testing Graphical Uninstallation UI...")
            page.locator("button.nav-item:has-text('Uninstall Software')").click()
            page.wait_for_selector(".installer-title:has-text('Software Uninstaller')", timeout=10000)

            assert page.locator(".installer-title:has-text('Software Uninstaller')").is_visible()
            assert page.locator("button:has-text('Uninstall Duino Humanizer')").is_visible()

            shot9 = str(SCREENSHOTS_DIR / "workflow_09_uninstall_prompt.png")
            page.screenshot(path=shot9)
            print(f"  [Proof] Screenshot captured: {shot9}")

            # Click Uninstall
            print("  [Action] Clicking 'Uninstall Duino Humanizer' button...")
            page.locator("button.btn-danger").click()

            # Wait for uninstallation completion screen
            page.wait_for_selector("text=Uninstallation Completed Successfully", timeout=20000)
            assert page.locator("button:has-text('Close Uninstaller')").is_visible()
            print("  [OK] Uninstallation completed successfully with clean confirmation!")

            shot10 = str(SCREENSHOTS_DIR / "workflow_10_uninstall_complete.png")
            page.screenshot(path=shot10)
            print(f"  [Proof] Screenshot captured: {shot10}")

            browser.close()

        print("\n" + "=" * 65)
        print("  ALL 8 WORKFLOW STAGES VERIFIED WITH 100% SUCCESS!")
        print("  10 HIGH-RESOLUTION PLAYWRIGHT SCREENSHOT PROOFS GENERATED.")
        print("=" * 65)

    finally:
        print("\n[Cleanup] Shutting down test backend...")
        server_process.terminate()
        try:
            server_process.wait(timeout=2)
        except Exception:
            server_process.kill()


if __name__ == "__main__":
    run_workflow_test()
