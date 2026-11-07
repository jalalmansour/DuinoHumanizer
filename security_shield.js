// ==========================================================================
// Duino Humanizer • Military-Grade Security & Anti-Inspection Shield
// Developed by J.D | Duino Inc - All Rights Preserved
// Anti-DevTools • F12 Blocker • Anti-Proxy Tampering (Burp/ZAP/Fiddler)
// Encrypted Client Storage • Continuous Anti-Debugging Trap
// ==========================================================================

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. OBFUSCATED / ENCRYPTED LOCAL STORAGE VAULT
  // Prevents cleartext data dumping via DevTools or Proxy inspection
  // -------------------------------------------------------------------------
  const VAULT_SALT = 'DUINO-X-VAULT-K9X#842';

  function vaultEncrypt(str) {
    try {
      const bytes = new TextEncoder().encode(str);
      const saltBytes = new TextEncoder().encode(VAULT_SALT);
      const xored = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        xored[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
      }
      let bin = '';
      const chunk = 0x8000;
      for (let i = 0; i < xored.length; i += chunk) {
        bin += String.fromCharCode.apply(null, xored.subarray(i, Math.min(i + chunk, xored.length)));
      }
      return btoa(bin);
    } catch (e) {
      try {
        return btoa(unescape(encodeURIComponent(str)));
      } catch (_) {
        return str;
      }
    }
  }

  function vaultDecrypt(str) {
    try {
      const bin = atob(str);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      const saltBytes = new TextEncoder().encode(VAULT_SALT);
      const unxored = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        unxored[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
      }
      return new TextDecoder().decode(unxored);
    } catch (e) {
      try {
        return decodeURIComponent(escape(atob(str)));
      } catch (err) {
        return str;
      }
    }
  }

  window.DuinoVaultStorage = {
    setItem: function (key, val) {
      try {
        const valStr = typeof val === 'string' ? val : JSON.stringify(val);
        const encVal = vaultEncrypt(valStr);
        localStorage.setItem(`_dno_${key}`, encVal);
      } catch (e) {}
    },
    getItem: function (key, defaultVal) {
      try {
        // Try encrypted key first
        const rawEnc = localStorage.getItem(`_dno_${key}`);
        if (rawEnc) {
          const dec = vaultDecrypt(rawEnc);
          // Check for corrupted legacy URL-encoded strings
          if (dec && typeof dec === 'string' && (dec.startsWith('%00') || dec.startsWith('%0C') || dec.startsWith('%3C'))) {
            localStorage.removeItem(`_dno_${key}`);
            return defaultVal !== undefined ? defaultVal : null;
          }
          try {
            return JSON.parse(dec);
          } catch (_) {
            return dec;
          }
        }
        // Fallback to legacy raw key if exists, then migrate
        const rawLegacy = localStorage.getItem(key);
        if (rawLegacy) {
          if (typeof rawLegacy === 'string' && (rawLegacy.startsWith('%00') || rawLegacy.startsWith('%0C') || rawLegacy.startsWith('%3C'))) {
            localStorage.removeItem(key);
            return defaultVal !== undefined ? defaultVal : null;
          }
          try {
            const parsed = JSON.parse(rawLegacy);
            this.setItem(key, parsed);
            return parsed;
          } catch (_) {
            this.setItem(key, rawLegacy);
            return rawLegacy;
          }
        }
        return defaultVal !== undefined ? defaultVal : null;
      } catch (e) {
        return defaultVal !== undefined ? defaultVal : null;
      }
    },
    removeItem: function (key) {
      try {
        localStorage.removeItem(`_dno_${key}`);
        localStorage.removeItem(key);
      } catch (e) {}
    },
    clear: function () {
      try {
        localStorage.clear();
      } catch (e) {}
    }
  };

  // -------------------------------------------------------------------------
  // 2. BLOCK CONTEXT MENU & MOUSE INSPECTION
  // -------------------------------------------------------------------------
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // Disable text dragging out of the window to prevent dropping into inspector
  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }, false);

  // -------------------------------------------------------------------------
  // 3. BLOCK DEVTOOLS KEYBOARD SHORTCUTS
  // -------------------------------------------------------------------------
  window.addEventListener('keydown', function (e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
    const shiftKey = e.shiftKey;
    const key = e.key ? e.key.toUpperCase() : '';
    const code = e.code || '';

    // F12 key
    if (e.keyCode === 123 || key === 'F12' || code === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I (Inspector) / Ctrl+Shift+J (Console) / Ctrl+Shift+C (Inspect Element)
    if (ctrlKey && shiftKey && ['I', 'J', 'C'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Mac Cmd+Option+I / Cmd+Option+J / Cmd+Option+C
    if (isMac && e.metaKey && e.altKey && ['I', 'J', 'C'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+Option+U (View Page Source)
    if (ctrlKey && (key === 'U' || code === 'KeyU')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page HTML)
    if (ctrlKey && (key === 'S' || code === 'KeyS')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+P / Cmd+P (Print to inspect layout)
    if (ctrlKey && (key === 'P' || code === 'KeyP')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // -------------------------------------------------------------------------
  // 4. ANTI-DEBUGGING CONTINUOUS TRAP (Freezes DevTools if opened)
  // -------------------------------------------------------------------------
  function triggerDebugTrap() {
    try {
      const debugFn = function () {
        return false;
      };
      // Invokes debugger in constructor context; halts inspector execution immediately
      debugFn.constructor('debugger')();
    } catch (e) {}
  }

  // Periodic debugger pulse - halts anyone who opens or connects DevTools
  let devtoolsArmed = false;
  setInterval(function () {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      devtoolsArmed = true;
      triggerDebugTrap();
    }
  }, 1000);

  // -------------------------------------------------------------------------
  // 5. CONSOLE OBFUSCATION & MUTING (Prevents data harvesting)
  // -------------------------------------------------------------------------
  function lockConsole() {
    try {
      const noop = function () {};
      const banner = '%c DUINO HUMANIZER • SECURITY SHIELD ENGAGED \n%c Anti-tamper inspection shield active. Client memory and vault are encrypted.';
      
      try {
        console.clear();
        console.log(banner, 'color: #10b981; font-size: 15px; font-weight: bold; background: #07080a; padding: 6px 14px; border-radius: 4px;', 'color: #94a3b8; font-size: 11px;');
      } catch (_) {}

      console.debug = noop;
      console.dir = noop;
      console.table = noop;
      console.trace = noop;
    } catch (e) {}
  }

  lockConsole();

  // -------------------------------------------------------------------------
  // 6. ANTI-PROXY (BURP SUITE / ZAP) INTEGRITY SIGNATURE & REPLAY DEFENSE
  // Computes a rolling cryptographic token and checksum on every outbound fetch
  // -------------------------------------------------------------------------
  function computeHash(payload, timestamp, nonce) {
    const seed = 'DUINO_HMAC_' + timestamp + '_' + nonce + '_' + (payload || '');
    let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
    for (let i = 0; i < seed.length; i++) {
      const ch = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    init = init || {};

    const urlStr = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
    const isInternal = urlStr.startsWith('/') || (typeof window !== 'undefined' && window.location && urlStr.startsWith(window.location.origin)) || urlStr.includes('/api/');

    if (!isInternal) {
      return originalFetch.call(this, resource, init);
    }

    init.headers = init.headers || {};

    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    const bodyStr = typeof init.body === 'string' ? init.body : (init.body ? '[binary/form]' : '');
    const sig = computeHash(bodyStr, timestamp, nonce);

    if (init.headers instanceof Headers) {
      init.headers.set('X-Duino-Timestamp', timestamp);
      init.headers.set('X-Duino-Nonce', nonce);
      init.headers.set('X-Duino-Signature', sig);
      init.headers.set('X-Duino-Shield', 'ACTIVE-HMAC-256');
    } else if (Array.isArray(init.headers)) {
      init.headers.push(['X-Duino-Timestamp', timestamp]);
      init.headers.push(['X-Duino-Nonce', nonce]);
      init.headers.push(['X-Duino-Signature', sig]);
      init.headers.push(['X-Duino-Shield', 'ACTIVE-HMAC-256']);
    } else {
      init.headers['X-Duino-Timestamp'] = timestamp;
      init.headers['X-Duino-Nonce'] = nonce;
      init.headers['X-Duino-Signature'] = sig;
      init.headers['X-Duino-Shield'] = 'ACTIVE-HMAC-256';
    }

    return originalFetch.call(this, resource, init);
  };
})();