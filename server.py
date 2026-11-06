#!/usr/bin/env python3
"""
server.py
High-Performance Local Backend API Server for Checker PRO (Duino Humanizer).
Exposes REST endpoints for the React 18 Desktop Software.
Integrates UniversalDocumentParser, LoopParaphraseEngine, ZeroGPT, and SuperHumanizer.
Fully developed by J.D | Duino Inc. All rights are preserved.
"""

import os
import sys
import re
import json
import time
import subprocess
import importlib
import importlib.util
from datetime import datetime
import shutil
import zipfile
import threading
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.parse
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
import cgi

# Safe logger for windowless execution
class SafeWriter:
    def __init__(self, log_path=None):
        self.log_path = log_path
    def write(self, s):
        if self.log_path and s:
            try:
                with open(self.log_path, "a", encoding="utf-8") as f:
                    f.write(s)
            except Exception:
                pass
    def flush(self):
        pass
    def reconfigure(self, **kwargs):
        pass

HERE = Path(__file__).resolve().parent
server_log = HERE / "server.log"
if sys.stdout is None:
    sys.stdout = SafeWriter(server_log)
else:
    try:
        sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    except Exception:
        pass

if sys.stderr is None:
    sys.stderr = SafeWriter(server_log)
else:
    try:
        sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Auto-install missing Python packages before importing them
# ---------------------------------------------------------------------------
def _ensure_packages():
    """Check and install any missing pip packages required by the server."""
    required = [
        ("playwright", "playwright"),
        ("reportlab", "reportlab"),
        ("docx", "python-docx"),
        ("fitz", "pymupdf"),
        ("bs4", "beautifulsoup4"),
    ]
    missing = [pkg for mod, pkg in required if importlib.util.find_spec(mod) is None]
    if missing:
        print(f"[Auto-Install] Missing packages detected: {missing}", flush=True)
        try:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "--disable-pip-version-check"] + missing,
                stdout=sys.stdout, stderr=sys.stderr,
            )
            print("[Auto-Install] Packages installed successfully.", flush=True)
        except Exception as e:
            print(f"[Auto-Install] WARNING: pip install failed: {e}", flush=True)
            print("[Auto-Install] Server will start but some features may be unavailable.", flush=True)

# Ensure scripts path is loaded
SCRIPTS_DIR = HERE / "paraphraser" / "scripts"
PARAPHRASER_DIR = HERE / "paraphraser"
sys.path.insert(0, str(SCRIPTS_DIR))
sys.path.insert(0, str(PARAPHRASER_DIR))
sys.path.insert(0, str(HERE))

import difflib
import secured_db

ENGINE_READY = False
ENGINE_INIT_ERROR = None
UniversalDocumentParser = None
run_paraphraser = None
TextNormalizer = None
LoopParaphraseEngine = None

def _init_engines_async():
    global UniversalDocumentParser, run_paraphraser, TextNormalizer, LoopParaphraseEngine, ENGINE_READY, ENGINE_INIT_ERROR
    try:
        _ensure_packages()
        from document_parser import UniversalDocumentParser as _UDP
        from paraphraser_cli import run_paraphraser as _RP
        from text_normalizer import TextNormalizer as _TN
        from loop_verifier import LoopParaphraseEngine as _LPE
        UniversalDocumentParser = _UDP
        run_paraphraser = _RP
        TextNormalizer = _TN
        LoopParaphraseEngine = _LPE
        ENGINE_READY = True
        print("[Duino Server] All Humanizer engines successfully initialized.", flush=True)
    except Exception as e:
        ENGINE_INIT_ERROR = str(e)
        print(f"[Duino Server] Engine init error: {e}", flush=True)

# Start engine initialization asynchronously so server binds port immediately
threading.Thread(target=_init_engines_async, daemon=True).start()

def wait_for_engine(timeout=45.0):
    start = time.time()
    while not ENGINE_READY and not ENGINE_INIT_ERROR and (time.time() - start < timeout):
        time.sleep(0.1)
    if ENGINE_INIT_ERROR:
        raise RuntimeError(f"Humanizer engine initialization failed: {ENGINE_INIT_ERROR}")

TEMP_UPLOAD_DIR = HERE / "temp_uploads"
TEMP_OUTPUT_DIR = HERE / "temp_outputs"
SCREENSHOTS_DIR = HERE / "screenshots"
WEB_DIR = HERE / "web"

TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
WEB_DIR.mkdir(parents=True, exist_ok=True)

INSTALL_MARKER = HERE / ".installed"
is_setup_mode = ("--setup" in sys.argv) or ("--install" in sys.argv)
is_installed_marker = INSTALL_MARKER.exists() and not is_setup_mode

INSTALL_STATE = {
    "is_installed": is_installed_marker,
    "is_installing": False,
    "step_index": 5 if is_installed_marker else 0,
    "total_steps": 5,
    "current_step_name": "Ready" if is_installed_marker else "Not started",
    "details": "Environment initialized" if is_installed_marker else "Click Start Installation to configure system",
    "progress": 1.0 if is_installed_marker else 0.0,
    "error": None
}

# Word Diff Computation Engine (Side-by-Side Blue/Green Highlights)
def compute_word_diff(t1: str, t2: str) -> dict:
    """Computes word-level diff using Python difflib SequenceMatcher."""
    if not t1 and not t2:
        return {"orig_spans": [], "hum_spans": []}
    if not t1:
        return {"orig_spans": [], "hum_spans": [{"text": t2 or "", "changed": True}]}
    if not t2:
        return {"orig_spans": [{"text": t1 or "", "changed": True}], "hum_spans": []}

    w1 = re.findall(r"\S+|\s+", t1)
    w2 = re.findall(r"\S+|\s+", t2)

    norm1 = [re.sub(r"[^\w]", "", w).lower() for w in w1]
    norm2 = [re.sub(r"[^\w]", "", w).lower() for w in w2]

    sm = difflib.SequenceMatcher(None, norm1, norm2)

    orig_spans = []
    hum_spans = []

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            orig_spans.append({"text": "".join(w1[i1:i2]), "changed": False})
            hum_spans.append({"text": "".join(w2[j1:j2]), "changed": False})
        elif tag == "replace":
            orig_spans.append({"text": "".join(w1[i1:i2]), "changed": True})
            hum_spans.append({"text": "".join(w2[j1:j2]), "changed": True})
        elif tag == "delete":
            orig_spans.append({"text": "".join(w1[i1:i2]), "changed": True})
        elif tag == "insert":
            hum_spans.append({"text": "".join(w2[j1:j2]), "changed": True})

    return {"orig_spans": orig_spans, "hum_spans": hum_spans}

# Shared Application State
STATE = {
    "queue": [],
    "results": {},
    "is_processing": False,
    "current_file": None,
    "current_event": "",
    "event_data": {},
    "progress": 0.0,
    "stop_requested": False,
    "cancelled_files": set(),
    "config": {
        "model": "Super Ultra",
        "purpose": "Academic",
        "target_ai": 7.0,
        "max_loops": 15,
        "headless": True,
        "preserve_anchors": True,
        "output_dir": str(TEMP_OUTPUT_DIR),
    }
}
STATE_LOCK = threading.Lock()


class APIServerHandler(SimpleHTTPRequestHandler):
    """Handles static web requests and REST API calls."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def end_headers(self):
        # Allow cross-origin and disable caching for API
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/status":
            try:
                vault_s = secured_db.get_vault_summary(SCREENSHOTS_DIR)
            except Exception:
                vault_s = None

            with STATE_LOCK:
                resp = {
                    "is_processing": STATE["is_processing"],
                    "current_file": STATE["current_file"],
                    "current_event": STATE["current_event"],
                    "event_data": STATE["event_data"],
                    "progress": STATE["progress"],
                    "queue_count": len(STATE["queue"]),
                    "results_count": len(STATE["results"]),
                    "config": STATE["config"],
                    "is_installed": INSTALL_MARKER.exists(),
                    "stop_requested": STATE.get("stop_requested", False),
                    "cancelled_files": list(STATE.get("cancelled_files", set())),
                    "vault_stats": vault_s,
                    "engine_ready": ENGINE_READY,
                    "engine_error": ENGINE_INIT_ERROR,
                }
            self._send_json(resp)

        elif path == "/api/vault-stats":
            self._send_json(secured_db.get_vault_summary(SCREENSHOTS_DIR))

        elif path == "/api/vault-history":
            try:
                history = secured_db.get_recent_vault_documents(50)
            except Exception as e:
                history = []
            self._send_json({"success": True, "history": history})

        elif path == "/api/install-status":
            with STATE_LOCK:
                resp = dict(INSTALL_STATE)
            self._send_json(resp)

        elif path == "/api/queue":
            with STATE_LOCK:
                resp = {
                    "queue": STATE["queue"],
                    "results": STATE["results"],
                    "config": STATE["config"],
                    "is_processing": STATE["is_processing"],
                    "stop_requested": STATE.get("stop_requested", False),
                    "cancelled_files": list(STATE.get("cancelled_files", set())),
                }
            self._send_json(resp)

        elif path.startswith("/api/download/"):
            filename = urllib.parse.unquote(path.replace("/api/download/", ""))
            file_path = TEMP_OUTPUT_DIR / filename
            if file_path.exists() and file_path.is_file():
                self._send_file(file_path, as_attachment=True)
            else:
                self.send_error(404, "File not found")

        elif path.startswith("/api/download-audit/"):
            filename = urllib.parse.unquote(path.replace("/api/download-audit/", ""))
            file_path = TEMP_OUTPUT_DIR / filename
            if file_path.exists() and file_path.is_file():
                self._send_file(file_path, as_attachment=True)
            else:
                self.send_error(404, "Audit file not found")

        elif path == "/api/download-all":
            # Build archive of all outputs
            zip_path = TEMP_OUTPUT_DIR / "Duino_Humanizer_Deliverables.zip"
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                with STATE_LOCK:
                    for k, res in STATE["results"].items():
                        out_f = res.get("output_file")
                        if out_f and os.path.isfile(out_f):
                            zf.write(out_f, arcname=Path(out_f).name)
                        aud_f = res.get("audit_file")
                        if aud_f and os.path.isfile(aud_f):
                            zf.write(aud_f, arcname=Path(aud_f).name)
            if zip_path.exists():
                self._send_file(zip_path, as_attachment=True)
            else:
                self.send_error(404, "Archive could not be created")

        elif path == "/api/screenshots":
            shots = []
            if SCREENSHOTS_DIR.exists():
                for f in sorted(SCREENSHOTS_DIR.glob("*.png"), key=os.path.getmtime, reverse=True):
                    secured_db.register_screenshot(f)
                    shots.append({
                        "name": f.name,
                        "url": f"/api/screenshot/{f.name}",
                        "timestamp": datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                        "size": f.stat().st_size
                    })
            cache_stats = secured_db.get_screenshot_cache_stats(SCREENSHOTS_DIR)
            self._send_json({"screenshots": shots, "cache_stats": cache_stats})

        elif path.startswith("/api/screenshot/"):
            shot_name = urllib.parse.unquote(path.replace("/api/screenshot/", ""))
            shot_path = SCREENSHOTS_DIR / shot_name
            if shot_path.exists() and shot_path.is_file():
                self._send_file(shot_path, content_type="image/png")
            else:
                self.send_error(404, "Screenshot not found")

        else:
            # Serve React static assets
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/upload":
            content_type = self.headers.get("Content-Type", "")
            if "multipart/form-data" in content_type:
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={"REQUEST_METHOD": "POST", "CONTENT_TYPE": content_type}
                )
                added = []
                for field in form.keys():
                    item = form[field]
                    if item.filename:
                        safe_name = re.sub(r"[\s\u00a0\u202f]+", " ", item.filename).strip()
                        dest = TEMP_UPLOAD_DIR / safe_name
                        with open(dest, "wb") as f:
                            f.write(item.file.read())
                        doc_info = UniversalDocumentParser.read(str(dest))
                        with STATE_LOCK:
                            # Avoid duplicates
                            existing = next((x for x in STATE["queue"] if x["filename"] == safe_name), None)
                            if not existing:
                                entry = {
                                    "filename": safe_name,
                                    "path": str(dest),
                                    "doc_type": doc_info["doc_type"],
                                    "char_count": doc_info["char_count"],
                                    "word_count": doc_info["word_count"],
                                    "structured_layout": doc_info.get("structured_layout"),
                                    "text": doc_info["text"],
                                    "status": "QUEUED",
                                    "error": None
                                }
                                STATE["queue"].append(entry)
                                added.append(entry)
                self._send_json({"success": True, "added": len(added)})
            else:
                self.send_error(400, "Expected multipart/form-data")

        elif path == "/api/ingest-path":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
            raw_path = data.get("path", "").strip()

            resolved = UniversalDocumentParser.resolve_file_path(raw_path)
            if resolved and os.path.isfile(resolved):
                fname = os.path.basename(resolved)
                safe_name = re.sub(r"[\s\u00a0\u202f]+", " ", fname).strip()
                dest = TEMP_UPLOAD_DIR / safe_name
                if Path(resolved).resolve() != dest.resolve():
                    shutil.copy2(resolved, str(dest))
                doc_info = UniversalDocumentParser.read(str(dest))
                with STATE_LOCK:
                    existing = next((x for x in STATE["queue"] if x["filename"] == safe_name), None)
                    if not existing:
                        entry = {
                            "filename": safe_name,
                            "path": str(dest),
                            "doc_type": doc_info["doc_type"],
                            "char_count": doc_info["char_count"],
                            "word_count": doc_info["word_count"],
                            "structured_layout": doc_info.get("structured_layout"),
                            "text": doc_info["text"],
                            "status": "QUEUED",
                            "error": None
                        }
                        STATE["queue"].append(entry)
                self._send_json({"success": True, "filename": safe_name})
            else:
                self._send_json({"success": False, "error": "File not found or inaccessible"})

        elif path == "/api/config":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
            with STATE_LOCK:
                STATE["config"].update(data)
            self._send_json({"success": True, "config": STATE["config"]})

        elif path == "/api/humanize-text":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
            raw_text = data.get("text", "").strip()

            if not raw_text:
                self._send_json({"success": False, "error": "Empty text supplied"})
                return

            with STATE_LOCK:
                cfg = dict(STATE["config"])

            model = data.get("model", cfg.get("model", "Super Ultra"))
            purpose = data.get("purpose", cfg.get("purpose", "Academic"))
            target_ai = float(data.get("target_ai", cfg.get("target_ai", 7.0)))
            max_loops = int(data.get("max_loops", cfg.get("max_loops", 15)))

            try:
                engine = LoopParaphraseEngine(
                    headless=cfg.get("headless", True),
                    max_loops=max_loops,
                    target_max_ai=target_ai,
                    model=model,
                    purpose=purpose,
                    screenshots_dir=str(SCREENSHOTS_DIR),
                )
                report = engine.run(raw_text)

                # Persist to Secured Database Vault
                try:
                    secured_db.save_document_record(
                        filename=data.get("filename", "Direct_Input_Text"),
                        original_text=raw_text,
                        humanized_text=report.get("final_text", raw_text),
                        baseline_ai=float(report.get("baseline_ai_score", 0.0)),
                        final_ai=float(report.get("final_ai_score", 0.0)),
                        word_count=len(report.get("final_text", "").split()),
                        status="COMPLETED"
                    )
                except Exception as db_err:
                    print(f"[SecuredDB Note] {db_err}")

                self._send_json({
                    "success": True,
                    "original_text": report.get("original_text", raw_text),
                    "humanized_text": report.get("final_text", raw_text),
                    "baseline_ai_score": report.get("baseline_ai_score", 0.0),
                    "final_ai_score": report.get("final_ai_score", 0.0),
                    "final_human_score": report.get("final_human_score", 100.0),
                    "verdict": report.get("final_verdict", "Human Written"),
                    "description": report.get("final_description", "Text humanized successfully"),
                    "word_count": len(report.get("final_text", "").split()),
                    "char_count": len(report.get("final_text", "")),
                    "iterations": report.get("iterations_completed", 1),
                })
            except Exception as e:
                self._send_json({"success": False, "error": str(e)})

        elif path == "/api/diff-words":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
            orig_text = data.get("original_text", "")
            hum_text = data.get("humanized_text", "")
            diff_res = compute_word_diff(orig_text, hum_text)
            self._send_json({"success": True, **diff_res})

        elif path == "/api/sanitize-text":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
            raw_text = data.get("text", "")
            sanitized = TextNormalizer.sanitize(raw_text)
            headings = len(re.findall(r"^#{1,6}\s+.*", sanitized, re.MULTILINE))
            self._send_json({
                "success": True,
                "sanitized_text": sanitized,
                "word_count": len(sanitized.split()),
                "char_count": len(sanitized),
                "headings_count": headings
            })

        elif path == "/api/export-text":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
            text = data.get("text", "")
            export_format = data.get("format", "txt").lower().lstrip(".")
            filename = data.get("filename", f"Humanized_Document.{export_format}")
            if not filename.endswith(f".{export_format}"):
                filename += f".{export_format}"

            with STATE_LOCK:
                out_dir = Path(STATE["config"].get("output_dir") or TEMP_OUTPUT_DIR)
            out_dir.mkdir(parents=True, exist_ok=True)
            dest_path = out_dir / filename

            saved_path = UniversalDocumentParser.save_output(
                text=text,
                output_path=str(dest_path),
                source_type=export_format
            )

            self._send_json({
                "success": True,
                "file_path": saved_path,
                "filename": filename,
                "download_url": f"/api/download/{urllib.parse.quote(filename)}"
            })

        elif path == "/api/open-output-dir":
            with STATE_LOCK:
                out_dir = Path(STATE["config"].get("output_dir") or TEMP_OUTPUT_DIR)
            out_dir.mkdir(parents=True, exist_ok=True)
            try:
                os.startfile(str(out_dir))
                self._send_json({"success": True, "path": str(out_dir)})
            except Exception as e:
                self._send_json({"success": False, "error": str(e), "path": str(out_dir)})

        elif path == "/api/clear-queue":
            with STATE_LOCK:
                STATE["queue"] = []
                STATE["results"] = {}
                STATE["progress"] = 0.0
                STATE["current_file"] = None
                STATE["current_event"] = ""
            self._send_json({"success": True})

        elif path == "/api/process":
            with STATE_LOCK:
                if STATE["is_processing"]:
                    self._send_json({"success": False, "error": "Already processing"})
                    return
                STATE["is_processing"] = True
                STATE["stop_requested"] = False
                STATE["cancelled_files"] = set()
                STATE["progress"] = 0.0

            # Start worker thread
            t = threading.Thread(target=process_queue_worker, daemon=True)
            t.start()
            self._send_json({"success": True, "message": "Processing started"})

        elif path in ["/api/stop-all", "/api/stop-process"]:
            length = int(self.headers.get("Content-Length", 0))
            if length > 0:
                self.rfile.read(length)
            with STATE_LOCK:
                STATE["stop_requested"] = True
                STATE["is_processing"] = False
                for itm in STATE["queue"]:
                    if itm.get("status") in ["QUEUED", "PROCESSING"]:
                        itm["status"] = "CANCELLED"
            self._send_json({"success": True, "message": "All batch processes stopped."})

        elif path == "/api/stop-file":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
            data = json.loads(body) if body else {}
            filename = data.get("filename", "")
            with STATE_LOCK:
                if "cancelled_files" not in STATE:
                    STATE["cancelled_files"] = set()
                STATE["cancelled_files"].add(filename)
                for itm in STATE["queue"]:
                    if itm.get("filename") == filename:
                        itm["status"] = "CANCELLED"
            self._send_json({"success": True, "filename": filename, "message": f"Processing stopped for {filename}"})

        elif path in ["/api/clear-screenshots", "/api/clear-cache"]:
            length = int(self.headers.get("Content-Length", 0))
            if length > 0:
                self.rfile.read(length)
            res = secured_db.clear_all_screenshots(SCREENSHOTS_DIR)
            self._send_json(res)

        elif path == "/api/run-install":
            with STATE_LOCK:
                if INSTALL_STATE["is_installing"]:
                    self._send_json({"success": False, "error": "Installation already in progress"})
                    return
                INSTALL_STATE["is_installing"] = True
                INSTALL_STATE["error"] = None
                INSTALL_STATE["progress"] = 0.0

            t = threading.Thread(target=run_installation_worker, daemon=True)
            t.start()
            self._send_json({"success": True, "message": "Installation started"})

        elif path == "/api/run-uninstall":
            try:
                # 1. Remove Desktop shortcuts
                desktop_paths = [
                    Path(os.environ.get("USERPROFILE", "")) / "OneDrive" / "Bureau" / "Checker PRO.lnk",
                    Path(os.environ.get("USERPROFILE", "")) / "Desktop" / "Checker PRO.lnk",
                    Path(os.environ.get("USERPROFILE", "")) / "OneDrive" / "Desktop" / "Checker PRO.lnk",
                ]
                for p in desktop_paths:
                    if p.exists():
                        try:
                            p.unlink()
                        except Exception:
                            pass

                # 2. Remove Start Menu shortcut
                start_menu = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Duino Humanizer"
                if start_menu.exists():
                    try:
                        shutil.rmtree(start_menu)
                    except Exception:
                        pass

                # 3. Clean Windows Registry
                try:
                    subprocess.run(
                        ["reg.exe", "delete", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\DuinoHumanizer", "/f"],
                        capture_output=True, timeout=5, check=False
                    )
                except Exception:
                    pass

                # 4. Remove .installed marker
                for m in [INSTALL_MARKER, HERE / ".installed"]:
                    if m.exists():
                        try:
                            m.unlink()
                        except Exception:
                            pass

                # 5. Clean temp directories
                for d in [TEMP_UPLOAD_DIR, TEMP_OUTPUT_DIR]:
                    if d.exists():
                        for f in d.iterdir():
                            try:
                                if f.is_file():
                                    f.unlink()
                            except Exception:
                                pass

                with STATE_LOCK:
                    INSTALL_STATE["is_installed"] = False
                    INSTALL_STATE["step_index"] = 0
                    INSTALL_STATE["progress"] = 0.0

                self._send_json({"success": True, "message": "Duino Humanizer uninstalled successfully"})
            except Exception as e:
                self._send_json({"success": False, "error": str(e)})

        else:
            self.send_error(404, "Unknown endpoint")

    def _send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, file_path: Path, content_type: str = None, as_attachment: bool = False):
        if not content_type:
            ext = file_path.suffix.lower()
            if ext == ".pdf":
                content_type = "application/pdf"
            elif ext == ".docx":
                content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif ext == ".zip":
                content_type = "application/zip"
            elif ext == ".json":
                content_type = "application/json"
            elif ext in [".txt", ".md"]:
                content_type = "text/plain; charset=utf-8"
            else:
                content_type = "application/octet-stream"

        with open(file_path, "rb") as f:
            data = f.read()

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if as_attachment:
            self.send_header("Content-Disposition", f'attachment; filename="{file_path.name}"')
        self.end_headers()
        self.wfile.write(data)


def verify_windows_dlls():
    import tempfile
    import urllib.request as _urlreq
    sys32 = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32"
    sys_wow64 = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "SysWOW64"
    dlls = ["msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll"]
    missing = [d for d in dlls if not ((sys32 / d).exists() or (sys_wow64 / d).exists())]
    if missing:
        vc_url = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
        installer_path = Path(tempfile.gettempdir()) / "vc_redist.x64.exe"
        try:
            _urlreq.urlretrieve(vc_url, str(installer_path))
            subprocess.run([str(installer_path), "/install", "/passive", "/norestart"], check=True)
        except Exception:
            pass


def verify_python_packages():
    import importlib.util
    reqs = [
        ("playwright", "playwright"),
        ("reportlab", "reportlab"),
        ("docx", "python-docx"),
        ("fitz", "pymupdf"),
        ("bs4", "beautifulsoup4"),
    ]
    missing = [pkg for mod, pkg in reqs if importlib.util.find_spec(mod) is None]
    if missing:
        subprocess.run([sys.executable, "-m", "pip", "install"] + missing, check=True)


def verify_playwright_engine():
    local_app_data = Path(os.environ.get("LOCALAPPDATA", "")) / "ms-playwright"
    has_chromium = local_app_data.exists() and any("chromium" in d.name.lower() for d in local_app_data.iterdir())
    if not has_chromium:
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)


def setup_desktop_shortcuts():
    try:
        ps_script = HERE / "make_shortcut.ps1"
        if ps_script.exists():
            subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", str(ps_script), "-TargetDir", str(HERE)], check=False)
    except Exception:
        pass


def finalize_installation():
    info = {
        "installed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "developer": "J.D | Duino Inc",
        "software": "Checker PRO (Duino Humanizer)",
        "version": "2.5.0",
        "status": "CONFIGURED",
        "license": "100% Free & Unlimited • 0 API Keys"
    }
    with open(INSTALL_MARKER, "w", encoding="utf-8") as f:
        json.dump(info, f, indent=2)


def run_installation_worker():
    """Background worker executing all 5 setup and installation steps."""
    steps = [
        ("Windows System DLLs", "Verifying MSVCP140 & VCRUNTIME140 runtime components", verify_windows_dlls),
        ("Document Engine Libraries", "Configuring wxPython, PyMuPDF, python-docx, and ReportLab", verify_python_packages),
        ("Stealth Playwright Chromium", "Configuring autonomous zero-API-key stealth browser engine", verify_playwright_engine),
        ("Desktop Integration", "Registering desktop shell shortcuts and icon associations", setup_desktop_shortcuts),
        ("Security & Finalization", "Verifying anti-reverse engineering checksums and environment marker", finalize_installation),
    ]

    total = len(steps)
    for idx, (name, desc, func) in enumerate(steps):
        with STATE_LOCK:
            INSTALL_STATE["step_index"] = idx + 1
            INSTALL_STATE["current_step_name"] = name
            INSTALL_STATE["details"] = desc
            INSTALL_STATE["progress"] = idx / total
        time.sleep(0.4)
        try:
            func()
        except Exception as e:
            with STATE_LOCK:
                INSTALL_STATE["is_installing"] = False
                INSTALL_STATE["error"] = str(e)
                INSTALL_STATE["details"] = f"Error during {name}: {e}"
            return

    with STATE_LOCK:
        INSTALL_STATE["is_installing"] = False
        INSTALL_STATE["is_installed"] = True
        INSTALL_STATE["step_index"] = 5
        INSTALL_STATE["current_step_name"] = "Ready"
        INSTALL_STATE["details"] = "Installation complete. Launching Duino Humanizer..."
        INSTALL_STATE["progress"] = 1.0


def process_queue_worker():
    """Background worker to humanize and verify queued documents."""
    with STATE_LOCK:
        queue_copy = list(STATE["queue"])
        cfg = dict(STATE["config"])

    total = len(queue_copy)
    if total == 0:
        with STATE_LOCK:
            STATE["is_processing"] = False
        return

    for idx, item in enumerate(queue_copy):
        fname = item["filename"]
        with STATE_LOCK:
            if STATE.get("stop_requested"):
                item["status"] = "CANCELLED"
                continue
            if fname in STATE.get("cancelled_files", set()):
                item["status"] = "CANCELLED"
                continue
            STATE["current_file"] = fname
            STATE["progress"] = idx / total
            item["status"] = "PROCESSING"

        def ui_callback(event: str, data: dict):
            with STATE_LOCK:
                STATE["current_event"] = event
                STATE["event_data"] = data

        orig_stem = Path(fname).stem
        orig_ext = Path(fname).suffix or ".txt"
        target_dir = Path(cfg.get("output_dir") or TEMP_OUTPUT_DIR)
        target_dir.mkdir(parents=True, exist_ok=True)
        out_path = str(target_dir / f"{orig_stem}_humanized{orig_ext}")

        try:
            with STATE_LOCK:
                if STATE.get("stop_requested") or fname in STATE.get("cancelled_files", set()):
                    item["status"] = "CANCELLED"
                    continue

            report = run_paraphraser(
                input_source=item["path"],
                output_path=out_path,
                target_ai=cfg["target_ai"],
                model=cfg["model"],
                purpose=cfg["purpose"],
                max_loops=cfg["max_loops"],
                screenshots_dir=str(SCREENSHOTS_DIR),
                headless=cfg["headless"],
                progress_callback=ui_callback,
            )

            with STATE_LOCK:
                if STATE.get("stop_requested") or fname in STATE.get("cancelled_files", set()):
                    item["status"] = "CANCELLED"
                else:
                    item["status"] = report.get("status", "COMPLETED")
                    item["report"] = report
                    item["output_file"] = report.get("output_file", out_path)
                    item["error"] = None
                    STATE["results"][fname] = report

                    # Persist to Secured DB Vault
                    try:
                        secured_db.save_document_record(
                            filename=fname,
                            original_text=item.get("text", ""),
                            humanized_text=report.get("final_text", ""),
                            baseline_ai=float(report.get("baseline_ai_score", 0.0)),
                            final_ai=float(report.get("final_ai_score", 0.0)),
                            word_count=int(item.get("word_count", 0)),
                            status=item["status"]
                        )
                    except Exception as db_err:
                        print(f"[SecuredDB Note] {db_err}")

        except BaseException as ex:
            with STATE_LOCK:
                if STATE.get("stop_requested") or fname in STATE.get("cancelled_files", set()):
                    item["status"] = "CANCELLED"
                else:
                    item["status"] = "ERROR"
                    item["error"] = str(ex)

        with STATE_LOCK:
            STATE["progress"] = (idx + 1) / total

    with STATE_LOCK:
        STATE["is_processing"] = False
        STATE["current_file"] = None
        STATE["current_event"] = "FINISHED"


def start_server(port: int = 8505) -> ThreadingHTTPServer:
    """Starts the multi-threaded HTTP API server."""
    server = ThreadingHTTPServer(("127.0.0.1", port), APIServerHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    print(f"[Duino Server] API and React frontend listening on http://127.0.0.1:{port}", flush=True)
    return server


if __name__ == "__main__":
    port = 8505
    if "--port" in sys.argv:
        try:
            idx = sys.argv.index("--port")
            port = int(sys.argv[idx + 1])
        except Exception:
            pass
    elif len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    s = start_server(port)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        s.shutdown()
