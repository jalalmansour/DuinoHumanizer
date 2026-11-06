#!/usr/bin/env node
// ==========================================================================
// bootstrap-python.js
// Automatic Python environment bootstrapper for Duino Humanizer.
// Guarantees zero-config operation even on machines without Python pre-installed.
// Developed by J.D | Duino Inc - All Rights Preserved
// ==========================================================================

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const RUNTIME_DIR = path.join(ROOT, 'python_runtime');
const MARKER = path.join(ROOT, '.python_deps_ok');

const REQUIRED = [
  { mod: 'playwright', pkg: 'playwright' },
  { mod: 'reportlab', pkg: 'reportlab' },
  { mod: 'docx', pkg: 'python-docx' },
  { mod: 'fitz', pkg: 'pymupdf' },
  { mod: 'bs4', pkg: 'beautifulsoup4' },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ── Discover Python across system and local portable runtime ─────────────
function findPython() {
  const localApp = process.env.LOCALAPPDATA || '';
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';

  const candidates = [
    // 1. Local portable runtime (bundled or auto-provisioned)
    path.join(RUNTIME_DIR, 'python.exe'),
    path.join(ROOT, 'python', 'python.exe'),

    // 2. Standard Windows installs
    'C:\\Users\\jalal\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
    path.join(localApp, 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python310', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python313', 'python.exe'),
    'C:\\Python311\\python.exe',
    'C:\\Python312\\python.exe',
    'C:\\Python310\\python.exe',

    // 3. Scoop / tools
    path.join(userProfile, 'scoop', 'apps', 'python', 'current', 'python.exe'),
    'C:\\tools\\python3\\python.exe',

    // 4. Unix / macOS paths
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/opt/homebrew/bin/python3',
  ];

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const r = spawnSync(c, ['--version'], { encoding: 'utf-8', timeout: 5000, windowsHide: true });
        if (r.status === 0 && (r.stdout || '').includes('Python 3')) return c;
      }
    } catch (e) {}
  }

  // 5. Try where / which
  try {
    if (process.platform === 'win32') {
      const out = execSync('where.exe python', { encoding: 'utf-8', timeout: 5000 });
      for (const line of out.split(/\r?\n/)) {
        const t = line.trim();
        if (t && !t.includes('WindowsApps') && fs.existsSync(t)) {
          const r = spawnSync(t, ['--version'], { encoding: 'utf-8', timeout: 5000, windowsHide: true });
          if (r.status === 0 && (r.stdout || '').includes('Python 3')) return t;
        }
      }
    } else {
      const w = execSync('which python3 2>/dev/null || which python 2>/dev/null', { encoding: 'utf-8', timeout: 5000 }).trim();
      if (w) return w;
    }
  } catch (e) {}

  // 6. Python Launcher on Windows (py -3)
  if (process.platform === 'win32') {
    try {
      const r = spawnSync('py', ['-3', '--version'], { encoding: 'utf-8', timeout: 5000, windowsHide: true });
      if (r.status === 0 && (r.stdout || '').includes('Python 3')) {
        const actual = execSync('py -3 -c "import sys; print(sys.executable)"', { encoding: 'utf-8', timeout: 10000 }).trim();
        return actual;
      }
    } catch (e) {}
  }

  return null;
}

// ── Auto-provision Python if completely missing on host OS ───────────────
async function provisionPython() {
  console.log('⚡  Python 3 was NOT detected on this machine.');
  console.log('⚡  Duino Humanizer Auto-Provisioner activating...');

  if (process.platform === 'win32') {
    // Attempt 1: winget silent install
    try {
      console.log('   Checking Windows Package Manager (winget)...');
      const wingetCheck = spawnSync('winget', ['--version'], { encoding: 'utf-8', timeout: 5000, windowsHide: true });
      if (wingetCheck.status === 0) {
        console.log('   Installing Python 3.11 silently via winget...');
        const installResult = spawnSync('winget', [
          'install', 'Python.Python.3.11',
          '--silent',
          '--accept-package-agreements',
          '--accept-source-agreements'
        ], { encoding: 'utf-8', timeout: 180000, windowsHide: true });

        if (installResult.status === 0) {
          const discovered = findPython();
          if (discovered) {
            console.log(`✓  Python 3.11 successfully provisioned via winget: ${discovered}`);
            return discovered;
          }
        }
      }
    } catch (e) {
      console.log(`   winget note: ${e.message}`);
    }
  }

  console.log('⚠  Please install Python 3.10+ from https://www.python.org/downloads/');
  console.log('   Make sure to check "Add Python to PATH" during installation.');
  return null;
}

// ── Main Bootstrap Flow ──────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('================================================================');
  console.log('  Duino Humanizer — Universal Environment Bootstrapper');
  console.log('  Developed by J.D | Duino Inc • All Rights Preserved');
  console.log('================================================================');
  console.log('');

  // Check if marker is fresh (< 24 hours old) and python path exists
  try {
    if (fs.existsSync(MARKER)) {
      const data = JSON.parse(fs.readFileSync(MARKER, 'utf-8'));
      if (data.python && fs.existsSync(data.python)) {
        console.log(`✓  Environment verified and ready. Python at: ${data.python}`);
        return;
      }
    }
  } catch (e) {}

  let pyExe = findPython();
  if (!pyExe) {
    pyExe = await provisionPython();
  }

  if (!pyExe) {
    console.log('⚠  Could not find or auto-provision Python 3.');
    return;
  }

  const ver = spawnSync(pyExe, ['--version'], { encoding: 'utf-8', timeout: 5000 });
  console.log(`✓  Found Python: ${pyExe}`);
  console.log(`   Version: ${(ver.stdout || '').trim()}`);
  console.log('');

  // Verify missing packages without hanging
  const missing = [];
  for (const { mod, pkg } of REQUIRED) {
    const r = spawnSync(pyExe, ['-c', `import ${mod}`], { encoding: 'utf-8', timeout: 15000, windowsHide: true });
    if (r.status !== 0) {
      missing.push(pkg);
      console.log(`   ✗  ${pkg} — MISSING`);
    } else {
      console.log(`   ✓  ${pkg}`);
    }
  }

  if (missing.length > 0) {
    console.log('');
    console.log(`Installing ${missing.length} missing package(s): ${missing.join(', ')}...`);
    const result = spawnSync(pyExe, ['-m', 'pip', 'install', '--disable-pip-version-check', ...missing], {
      encoding: 'utf-8',
      timeout: 300000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      console.log('⚠  pip install note:', (result.stderr || '').slice(0, 500));
    } else {
      console.log('✓  All Python packages installed successfully.');
    }
  } else {
    console.log('');
    console.log('✓  All required Python packages verified.');
  }

  // Playwright Chromium check
  console.log('');
  const localAppData = process.env.LOCALAPPDATA || '';
  const pwDir = path.join(localAppData, 'ms-playwright');
  let hasChromium = false;
  try {
    if (fs.existsSync(pwDir)) {
      hasChromium = fs.readdirSync(pwDir).some(e => e.toLowerCase().includes('chromium'));
    }
  } catch (e) {}

  if (hasChromium) {
    console.log('✓  Playwright Chromium browser engine verified.');
  } else {
    console.log('Installing Playwright Chromium engine...');
    spawnSync(pyExe, ['-m', 'playwright', 'install', 'chromium'], {
      encoding: 'utf-8',
      timeout: 300000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log('✓  Playwright Chromium installation completed.');
  }

  // Write verified marker
  try {
    fs.writeFileSync(MARKER, JSON.stringify({
      timestamp: new Date().toISOString(),
      python: pyExe,
      packages: REQUIRED.map(r => r.pkg),
      chromium: true
    }), 'utf-8');
  } catch (e) {}

  console.log('');
  console.log('================================================================');
  console.log('  ✓  Duino Humanizer environment ready! Launching...');
  console.log('================================================================');
  console.log('');
}

main().catch(err => {
  console.error('Bootstrap error:', err.message);
});
