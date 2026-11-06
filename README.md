# CHECKER PRO &bull; Duino Humanizer
### Native React 18 Desktop Software &bull; Universal MIME-Type Humanizer & Auto-Loop Verifier
**100% Free & Unlimited (0 API Keys, 0 Quota Limits) &bull; Native Desktop Software Window (Not Chrome)**  
*Architected and Fully Developed by **J.D | Duino Inc**. All Rights Are Preserved.*

---

## Executive Overview

**Checker PRO (Duino Humanizer)** transforms any document across any MIME-type (`.pdf`, `.docx`, `.doc`, `.md`, `.tex`, `.html`, `.rtf`, `.txt`) into a 100% humanized deliverable with zero AI detection hallmarks while preserving the original document's exact layout, metadata anchors, Roman numeral section hierarchies, and academic citation lists.

Built as a **Native Desktop Software Application** running an embedded high-performance React 18 frontend and local REST API server via Microsoft Edge WebView2 (wxPython), Checker PRO operates in its own dedicated, native Win32 application window &mdash; strictly avoiding Chrome browser windows, tabs, or address bars.

The user interface follows the **Anti-Slop Design System (Taste-Skill & Unslop Kit)**:
- Graphite tinted neutral ramp (`#0f0f10`, `#141415`, `#19191b`, `#232325`)
- Strict 4px spacing scale and nested radii ($R_{inner} = R_{outer} - padding$)
- Single emerald accent (`#10b981`) for selections and primary actions
- Zero emoji labels &bull; 100% crisp Lucide SVG line icons
- Tabular figures (`font-variant-numeric: tabular-nums`) for all scores and word counts
- Zero purple hue-to-hue glow gradients or artificial visual noise

```
┌────────────────────────────────────────────────────────────────────────┐
│  CHECKER PRO &bull; DUINO HUMANIZER (NATIVE REACT DESKTOP SOFTWARE)      │
│  Fully Developed by J.D | Duino Inc &bull; All Rights Preserved       │
├────────────────────────────────────────────────────────────────────────┤
│  [Humanizer Studio]  Drop Any Document (.pdf, .docx, .md, .html, .rtf) │
│     │                                                                  │
│     ▼                                                                  │
│  [Universal Parser] Extract Text + Anchor Title, Headings, Citations   │
│     │                                                                  │
│     ▼                                                                  │
│  [Semantic Chunker] Pack Chapters up to 14,000 Chars Capacity          │
│     │                                                                  │
│     ▼                                                                  │
│  [Maker Phase] SuperHumanizer Stealth Automation (Super Ultra / Lite)  │
│     │                                                                  │
│     ▼                                                                  │
│  [Checker Phase] ZeroGPT Detector (.percentage-div DOM Extraction)     │
│     │                                                                  │
│     ▼                                                                  │
│  [Quality Gate] AI Score < 7.0% (Target: 0.0% AI | 100.0% Human)       │
│     ├── NO  ──► Multi-Tier Adversarial Mutation & Cadence Inversion   │
│     └── YES ──► 100% Layout Reassembly & Direct Export (PDF/DOCX/MD)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5 Featured Navigation Views

### 1. Humanizer Studio
- **Multi-File Drag & Drop Zone:** Ingest single or dozens of documents simultaneously.
- **Direct File Path Ingestion:** Load documents directly from disk or network paths (handles Unicode spaces and non-breaking spaces seamlessly).
- **Queue Table:** Live status overview displaying Document Name, Format badge, Word count, Anchors Detected, and Processing Status.
- **Single-Click Batch Action:** Start humanization loop with one click or clear the queue.

### 2. Multi-File Batch Queue & Verification Metrics
- **Real-Time Progress Engine:** Stage indicator, loop count, and ZeroGPT score live polling.
- **File Detail Selector:** Switch between queued documents to inspect metrics individually.
- **KPI Metrics Cards:**
  - **Baseline AI Score:** ZeroGPT DOM scan before processing.
  - **Final AI Score:** ZeroGPT DOM scan after complete humanization.
  - **Human Style Index:** Perplexity, burstiness, and cadence rating.
  - **Detection Verdict:** ZeroGPT DOM badge (`HUMAN WRITTEN` vs `MIXED SIGNALS`).
- **One-Click Deliverable Downloads:**
  - Download Humanized File in original preserved format (`.docx`, `.pdf`, `.md`, `.txt`).
  - Download Audit JSON Report.
  - Download All (ZIP Archive) containing all deliverables and receipts.

### 3. Side-by-Side Layout Diff
- Synchronized dual-pane layout comparing original input document side-by-side with the 100% humanized deliverable.
- Preserves paragraph formatting, section headings, and academic reference lists.

### 4. Verification Proof Gallery
- Lightbox gallery of live autoscroll verification screenshot receipts from ZeroGPT (`.percentage-div`) and SuperHumanizer.
- Click any thumbnail for full-resolution inspection.

### 5. Legal & License Agreement
- Formal ownership and intellectual property notice declaring exclusive development by **J.D | Duino Inc**.
- Guarantee of 100% free and unlimited usage (0 API keys, 0 quota limits, 0 telemetry).
- Anti-reverse engineering and anti-tamper notice protecting binary components.

---

## Architecture & Binary Security

- **Native C Executable (`Checker.exe`):** High-performance Win32 PE executable compiled with MinGW GCC (`-O3 -s -mwindows`), stripping all symbols and debug metadata to prevent reverse engineering.
- **Embedded PE Metadata:** Declares Company Name `J.D | Duino Inc`, File Description `Checker PRO - Universal MIME-Type Humanizer & Auto-Loop Verifier`, and custom high-resolution icon.
- **Zero API Keys & 100% Offline Support:** Local multi-threaded REST API server (`server.py`) serving offline React 18 bundle and handling asynchronous humanization workers.

---

## Quick Start & Launching

### Option 1: Desktop Shortcut
Double-click `Checker PRO.lnk` on your Desktop.

### Option 2: Native Executable
Double-click `Checker.exe` in the application root directory.

### Option 3: Automated Laptop Setup
For a fresh user laptop, double-click `Checker_Setup.bat`. This automatically verifies system DLLs, installs dependencies, and configures Playwright Chromium.

### Option 4: Direct Launch
```powershell
& "C:\Users\jalal\AppData\Local\Programs\Python\Python311\python.exe" desktop_software.py
```

### Option 5: Recompile Native Binary
```powershell
& "C:\Users\jalal\AppData\Local\Programs\Python\Python311\python.exe" build_native.py
```

---

## Project Structure

```
Autochecker-Humanizer/
├── Checker.exe                 # Secured Native Win32 Executable (J.D | Duino Inc)
├── desktop_software.py         # Native Desktop Software Launcher (wx.html2 WebView2)
├── server.py                   # High-Performance Local REST API & Static Server
├── setup_environment.py        # Automated Dependency & DLL Bootstrapper
├── build_native.py             # MinGW GCC Compilation Script (-O3 -s -mwindows)
├── checker_main.c              # Native C Runner with Error Recovery
├── resource.rc                 # Windows Resource Definition (VersionInfo & Icon)
├── Checker.bat                 # One-Click Batch Launcher
├── Checker_Setup.bat           # Automated Environment Setup Script
├── make_shortcut.ps1           # Desktop Shortcut Generator
├── icon.ico                    # High-Resolution Application Icon
├── README.md                   # Complete Architectural Documentation
├── web/                        # React 18 Anti-Slop Frontend
│   ├── index.html              # HTML Shell
│   ├── styles.css              # Anti-Slop CSS Tokens (Graphite Ramp, Emerald Accent)
│   ├── app.jsx                 # React 18 Application (5 Featured Views)
│   └── vendor/                 # Local Offline Vendor Libraries (React, ReactDOM, Babel)
├── temp_uploads/               # Uploaded Documents Directory
├── temp_outputs/               # Processed Humanized Deliverables
├── screenshots/                # Real-Time Verification Receipts
└── paraphraser/                # Core Humanizer Engine
    ├── paraphraser_cli.py      # Humanizer Pipeline Orchestrator
    └── scripts/
        ├── document_parser.py  # Universal MIME Parser & Layout Preserver
        ├── loop_verifier.py    # Multi-Loop Verification Controller
        ├── rotary_browser.py   # Stealth Playwright Browser Manager
        ├── semantic_chunker.py # Semantic Chunking Engine (14k capacity)
        ├── superhumanizer.py   # SuperHumanizer.ai Automation
        └── zerogpt_detector.py # ZeroGPT DOM Scraper & Proof Capture
```

---

## 🛡️ License, Copyright & Attribution

```
================================================================================
SOFTWARE OWNERSHIP & ALL RIGHTS PRESERVED
This software is fully developed by J.D | Duino Inc.
All rights are preserved worldwide.
100% Free Software • 0 API Keys • 0 Quota Limits • Commercial & Academic Use
================================================================================
```
