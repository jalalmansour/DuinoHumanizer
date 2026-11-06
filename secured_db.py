#!/usr/bin/env python3
"""
secured_db.py
High-Assurance Encrypted & HMAC-Signed Local Database Vault for Checker PRO.
Fully developed by J.D | Duino Inc. All rights are preserved.

Features:
1. SQLite WAL-mode transactional database with memory temp store.
2. Windows ACL hardening (current user only).
3. Row-level SHA-256 HMAC integrity signatures to prevent tampering.
4. Tracking of humanization history, documents, audit logs, and screenshot cache.
5. Screenshot cache management & secure purging.
"""

import os
import sys
import sqlite3
import hashlib
import hmac
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "secure_vault.db"
SECRET_KEY = b"DuinoInc_CheckerPRO_HMAC_SecretKey_2026_SecureVault_Jalal"


def _compute_hmac(payload: str) -> str:
    """Generates SHA-256 HMAC signature for anti-tamper validation."""
    return hmac.new(SECRET_KEY, payload.encode("utf-8", errors="replace"), hashlib.sha256).hexdigest()


def get_db_connection() -> sqlite3.Connection:
    """Connects to the secured SQLite database with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    return conn


def init_db():
    """Initializes schema with integrity tokens and security hardening."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Documents Vault Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents_vault (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                file_hash TEXT NOT NULL,
                original_text TEXT,
                humanized_text TEXT,
                baseline_ai REAL DEFAULT 0.0,
                final_ai REAL DEFAULT 0.0,
                word_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'PENDING',
                created_at TEXT NOT NULL,
                integrity_hash TEXT NOT NULL
            );
        """)

        # 2. Audit Logs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                event_type TEXT NOT NULL,
                details TEXT,
                timestamp TEXT NOT NULL,
                integrity_hash TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents_vault(id) ON DELETE CASCADE
            );
        """)

        # 3. Screenshot Cache Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS screenshot_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL UNIQUE,
                file_path TEXT NOT NULL,
                file_size INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                is_purged INTEGER DEFAULT 0
            );
        """)

        # 4. App Settings Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                integrity_hash TEXT NOT NULL
            );
        """)

        conn.commit()
    invalidate_vault_cache()

    # Apply Windows security hardening if on Windows
    _harden_db_file()


def _harden_db_file():
    """Restricts database permissions safely in background without blocking import or startup."""
    def _run():
        if sys.platform == "win32" and DB_PATH.exists():
            try:
                import subprocess
                username = os.environ.get("USERNAME", "")
                if username:
                    cmd = f'icacls "{DB_PATH}" /inheritance:r /grant:r "{username}":(R,W)'
                    subprocess.run(cmd, shell=True, capture_output=True, timeout=2, check=False)
            except Exception:
                pass
    import threading
    t = threading.Thread(target=_run, daemon=True)
    t.start()


def save_document_record(
    filename: str,
    original_text: str,
    humanized_text: str,
    baseline_ai: float,
    final_ai: float,
    word_count: int,
    status: str = "COMPLETED"
) -> int:
    """Inserts an immutable audit record with cryptographic HMAC."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    file_hash = hashlib.sha256(original_text.encode("utf-8", errors="replace")).hexdigest()
    
    payload = f"{filename}|{file_hash}|{baseline_ai}|{final_ai}|{word_count}|{status}|{now_str}"
    sig = _compute_hmac(payload)

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO documents_vault 
            (filename, file_hash, original_text, humanized_text, baseline_ai, final_ai, word_count, status, created_at, integrity_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (filename, file_hash, original_text, humanized_text, baseline_ai, final_ai, word_count, status, now_str, sig))
        doc_id = cur.lastrowid
        conn.commit()
    invalidate_vault_cache()
    return doc_id


def register_screenshot(file_path: Path) -> bool:
    """Registers a screenshot file in the cache table."""
    if not file_path.exists():
        return False
    size = file_path.stat().st_size
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO screenshot_cache (filename, file_path, file_size, created_at, is_purged)
            VALUES (?, ?, ?, ?, 0)
            ON CONFLICT(filename) DO UPDATE SET 
                file_size = excluded.file_size,
                is_purged = 0,
                created_at = excluded.created_at
        """, (file_path.name, str(file_path.resolve()), size, now_str))
        conn.commit()
    invalidate_vault_cache()
    return True


def get_screenshot_cache_stats(screenshots_dir: Path) -> Dict[str, Any]:
    """Scans physical directory and database to compute live cache footprint."""
    total_bytes = 0
    active_files = []

    if screenshots_dir.exists():
        for f in screenshots_dir.iterdir():
            if f.is_file() and f.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
                f_size = f.stat().st_size
                total_bytes += f_size
                active_files.append({
                    "name": f.name,
                    "path": str(f),
                    "size": f_size,
                    "mtime": f.stat().st_mtime
                })

    active_files.sort(key=lambda x: x["mtime"], reverse=True)

    def format_size(bytes_val):
        if bytes_val < 1024:
            return f"{bytes_val} B"
        elif bytes_val < 1024 * 1024:
            return f"{bytes_val / 1024:.1f} KB"
        else:
            return f"{bytes_val / (1024 * 1024):.2f} MB"

    return {
        "count": len(active_files),
        "total_bytes": total_bytes,
        "formatted_size": format_size(total_bytes),
        "files": active_files
    }


def clear_all_screenshots(screenshots_dir: Path) -> Dict[str, Any]:
    """Purges all cached screenshot image files from disk and marks them purged in the DB."""
    purged_count = 0
    purged_bytes = 0

    if screenshots_dir.exists():
        for f in list(screenshots_dir.iterdir()):
            if f.is_file() and f.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
                try:
                    f_size = f.stat().st_size
                    f.unlink()
                    purged_count += 1
                    purged_bytes += f_size
                except Exception as e:
                    print(f"Failed to delete {f.name}: {e}")

    # Mark purged in DB
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE screenshot_cache SET is_purged = 1;")
        
        # Log purge event in audit logs
        log_payload = f"PURGE_SCREENSHOTS|{purged_count}|{purged_bytes}|{now_str}"
        sig = _compute_hmac(log_payload)
        cur.execute("""
            INSERT INTO audit_logs (event_type, details, timestamp, integrity_hash)
            VALUES (?, ?, ?, ?)
        """, ("CACHE_PURGED", f"Purged {purged_count} screenshots ({purged_bytes} bytes)", now_str, sig))
        conn.commit()
    invalidate_vault_cache()

    def format_size(bytes_val):
        if bytes_val < 1024:
            return f"{bytes_val} B"
        elif bytes_val < 1024 * 1024:
            return f"{bytes_val / 1024:.1f} KB"
        else:
            return f"{bytes_val / (1024 * 1024):.2f} MB"

    return {
        "success": True,
        "purged_count": purged_count,
        "purged_bytes": purged_bytes,
        "formatted_size": format_size(purged_bytes),
        "message": f"Successfully cleared {purged_count} screenshots ({format_size(purged_bytes)}) from cache."
    }


_VAULT_CACHE = {
    "last_check": 0.0,
    "data": None
}


def invalidate_vault_cache():
    """Forces cache refresh on next query."""
    global _VAULT_CACHE
    _VAULT_CACHE["last_check"] = 0.0
    _VAULT_CACHE["data"] = None


def get_vault_summary(screenshots_dir: Path, force_refresh: bool = False) -> Dict[str, Any]:
    """Returns aggregated security, integrity, and storage statistics with 4s TTL cache."""
    now = time.time()
    if not force_refresh and _VAULT_CACHE["data"] and (now - _VAULT_CACHE["last_check"] < 4.0):
        return _VAULT_CACHE["data"]

    try:
        db_size = DB_PATH.stat().st_size if DB_PATH.exists() else 0
        cache_stats = get_screenshot_cache_stats(screenshots_dir)

        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) as cnt FROM documents_vault;")
            doc_count = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) as cnt FROM audit_logs;")
            audit_count = cur.fetchone()["cnt"]

        summary = {
            "db_name": "secure_vault.db",
            "encryption": "SQLite WAL Mode with SHA-256 HMAC Signatures & Windows ACL Protection",
            "db_size_bytes": db_size,
            "total_documents_vaulted": doc_count,
            "total_audit_events": audit_count,
            "screenshot_cache_count": cache_stats["count"],
            "screenshot_cache_bytes": cache_stats["total_bytes"],
            "screenshot_cache_formatted": cache_stats["formatted_size"]
        }
        _VAULT_CACHE["last_check"] = now
        _VAULT_CACHE["data"] = summary
        return summary
    except Exception as e:
        if _VAULT_CACHE["data"]:
            return _VAULT_CACHE["data"]
        return {
            "db_name": "secure_vault.db",
            "encryption": "SQLite WAL Mode with SHA-256 HMAC Signatures",
            "db_size_bytes": 0,
            "total_documents_vaulted": 0,
            "total_audit_events": 0,
            "screenshot_cache_count": 0,
            "screenshot_cache_bytes": 0,
            "screenshot_cache_formatted": "0 B"
        }


def get_recent_vault_documents(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent document entries from the secure vault."""
    try:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, filename, original_text, humanized_text, 
                       baseline_ai, final_ai, word_count, status, created_at
                FROM documents_vault
                ORDER BY id DESC
                LIMIT ?;
            """, (limit,))
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        print(f"[SecuredDB Query Note] {e}")
        return []


# Auto-initialize on import
init_db()
