// ==========================================================================
// Duino Humanizer - Electron Main Application Process
// Developed by J.D | Duino Inc - All Rights Preserved
// Apple Liquid Glass Aesthetics • Embedded Python Backend Automation
// ==========================================================================

const { app, BrowserWindow, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn, execSync, spawnSync } = require('child_process');

// Enforce Windows AppUserModelID early so Windows groups window under Duino Inc
app.setAppUserModelId('JD.DuinoInc.DuinoHumanizer.2.5');

let mainWindow = null;
let pythonProcess = null;
const isSmokeTest = process.argv.includes('--smoke-test') || process.argv.includes('--test');
const isSetupMode = process.argv.includes('--setup') || process.argv.includes('--install') || process.argv.includes('-i');
const isUninstallMode = process.argv.includes('--uninstall') || process.argv.includes('-u');

// Resolve base directory whether running unpacked or packaged
const APP_DIR = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname;
const RES_DIR = process.resourcesPath || path.join(APP_DIR, 'resources');
const logFile = path.join(APP_DIR, 'electron_runtime.log');
const BOOTSTRAP_MARKER = path.join(APP_DIR, '.python_deps_ok');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line, 'utf-8');
  } catch (e) {}
  console.log(msg);
}

// =========================================================================
// 1. ROBUST PYTHON DISCOVERY — works on any Windows/Mac/Linux environment
// =========================================================================
function findPython() {
  const localApp = process.env.LOCALAPPDATA || '';
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';

  // Build a comprehensive list of candidate paths
  const candidates = [];

  // a) Explicit known paths (standard Python.org installs on Windows)
  for (const ver of ['Python313', 'Python312', 'Python311', 'Python310', 'Python39']) {
    candidates.push(path.join(localApp, 'Programs', 'Python', ver, 'python.exe'));
    candidates.push(`C:\\Python${ver.replace('Python', '')}\\python.exe`);
  }

  // b) Bundled Python shipped alongside the app (for portable/packaged builds)
  candidates.push(path.join(APP_DIR, 'python', 'python.exe'));
  candidates.push(path.join(RES_DIR, 'python', 'python.exe'));
  candidates.push(path.join(APP_DIR, 'python', 'python3.exe'));

  // c) Scoop / Chocolatey / common locations
  candidates.push(path.join(userProfile, 'scoop', 'apps', 'python', 'current', 'python.exe'));
  candidates.push('C:\\tools\\python3\\python.exe');

  // d) Unix/macOS paths
  candidates.push('/usr/bin/python3');
  candidates.push('/usr/local/bin/python3');
  candidates.push('/opt/homebrew/bin/python3');

  // e) pyenv
  const pyenvRoot = process.env.PYENV_ROOT || path.join(userProfile, '.pyenv');
  candidates.push(path.join(pyenvRoot, 'shims', 'python3'));
  candidates.push(path.join(pyenvRoot, 'shims', 'python'));

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        // Verify it's a real Python (not Windows Store stub)
        const result = spawnSync(c, ['--version'], { encoding: 'utf-8', timeout: 5000, windowsHide: true });
        if (result.status === 0 && (result.stdout || '').includes('Python 3')) {
          log(`Found Python at candidate: ${c}`);
          return c;
        }
      }
    } catch (e) {}
  }

  // f) Try `where.exe python` (Windows) or `which python3` (Unix)
  try {
    if (process.platform === 'win32') {
      const whereOut = execSync('where.exe python', { encoding: 'utf-8', timeout: 5000 });
      for (const line of whereOut.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.includes('WindowsApps') && fs.existsSync(trimmed)) {
          const check = spawnSync(trimmed, ['--version'], { encoding: 'utf-8', timeout: 5000, windowsHide: true });
          if (check.status === 0 && (check.stdout || '').includes('Python 3')) {
            log(`Found Python via where.exe: ${trimmed}`);
            return trimmed;
          }
        }
      }
    } else {
      const which = execSync('which python3 2>/dev/null || which python 2>/dev/null', { encoding: 'utf-8', timeout: 5000 }).trim();
      if (which && fs.existsSync(which)) {
        log(`Found Python via which: ${which}`);
        return which;
      }
    }
  } catch (e) {}

  // g) Try `py -3` launcher on Windows (Python Launcher for Windows)
  if (process.platform === 'win32') {
    try {
      const pyResult = spawnSync('py', ['-3', '--version'], { encoding: 'utf-8', timeout: 5000, windowsHide: true });
      if (pyResult.status === 0 && (pyResult.stdout || '').includes('Python 3')) {
        log('Found Python via py launcher');
        return 'py';
      }
    } catch (e) {}
  }

  log('WARNING: No Python found — will attempt fallback "python"');
  return 'python';
}

// =========================================================================
// 2. PYTHON DEPENDENCY BOOTSTRAP — ensures all pip packages are installed
// =========================================================================
function ensurePythonDeps(pyExe) {
  // Skip if deps were already verified in a recent run (within 24 hours)
  try {
    if (fs.existsSync(BOOTSTRAP_MARKER)) {
      const stats = fs.statSync(BOOTSTRAP_MARKER);
      const ageMs = Date.now() - stats.mtimeMs;
      if (ageMs < 24 * 60 * 60 * 1000) {
        log('Python deps already verified (marker fresh). Skipping bootstrap.');
        return true;
      }
    }
  } catch (e) {}

  log('Bootstrapping Python dependencies...');

  // Ensure pip is available
  try {
    const pipCheck = spawnSync(pyExe, ['-m', 'pip', '--version'], {
      encoding: 'utf-8',
      timeout: 15000,
      windowsHide: true,
      cwd: APP_DIR,
    });
    if (pipCheck.status !== 0) {
      log('pip not found, attempting ensurepip...');
      spawnSync(pyExe, ['-m', 'ensurepip', '--upgrade'], {
        encoding: 'utf-8',
        timeout: 60000,
        windowsHide: true,
        cwd: APP_DIR,
      });
    }
  } catch (e) {
    log(`pip bootstrap note: ${e.message}`);
  }

  // Check which packages are missing
  const requirements = [
    { mod: 'playwright', pkg: 'playwright' },
    { mod: 'reportlab', pkg: 'reportlab' },
    { mod: 'docx', pkg: 'python-docx' },
    { mod: 'fitz', pkg: 'pymupdf' },
    { mod: 'bs4', pkg: 'beautifulsoup4' },
  ];

  const missing = [];
  for (const { mod, pkg } of requirements) {
    const check = spawnSync(pyExe, ['-c', `import ${mod}`], {
      encoding: 'utf-8',
      timeout: 15000,
      windowsHide: true,
      cwd: APP_DIR,
    });
    if (check.status !== 0) {
      missing.push(pkg);
      log(`  Missing: ${pkg} (import ${mod} failed)`);
    } else {
      log(`  OK: ${pkg}`);
    }
  }

  if (missing.length > 0) {
    log(`Installing missing packages: ${missing.join(', ')}...`);
    const installResult = spawnSync(pyExe, ['-m', 'pip', 'install', '--disable-pip-version-check', ...missing], {
      encoding: 'utf-8',
      timeout: 300000, // 5 min max for install
      windowsHide: true,
      cwd: APP_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (installResult.status !== 0) {
      log(`pip install FAILED:\n${(installResult.stderr || '').slice(0, 2000)}`);
      return false;
    }
    log('pip install completed successfully.');
  }

  // Check Playwright Chromium browser engine
  try {
    const localAppData = process.env.LOCALAPPDATA || '';
    const pwDir = path.join(localAppData, 'ms-playwright');
    let hasChromium = false;
    if (fs.existsSync(pwDir)) {
      const entries = fs.readdirSync(pwDir);
      hasChromium = entries.some(e => e.toLowerCase().includes('chromium'));
    }
    if (!hasChromium) {
      log('Installing Playwright Chromium browser engine...');
      const pwResult = spawnSync(pyExe, ['-m', 'playwright', 'install', 'chromium'], {
        encoding: 'utf-8',
        timeout: 300000,
        windowsHide: true,
        cwd: APP_DIR,
      });
      if (pwResult.status !== 0) {
        log(`Playwright install note: ${(pwResult.stderr || '').slice(0, 500)}`);
        // Non-fatal: server can still start, just humanizer won't work until installed
      } else {
        log('Playwright Chromium installed successfully.');
      }
    }
  } catch (e) {
    log(`Playwright check note: ${e.message}`);
  }

  // Write marker file
  try {
    fs.writeFileSync(BOOTSTRAP_MARKER, JSON.stringify({
      timestamp: new Date().toISOString(),
      python: pyExe,
      packages: requirements.map(r => r.pkg),
    }), 'utf-8');
  } catch (e) {}

  return true;
}

// =========================================================================
// 3. FIND AVAILABLE TCP PORT
// =========================================================================
function findAvailablePort(startPort = 8505) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      server.once('close', () => resolve(startPort));
      server.close();
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// =========================================================================
// 4. KILL PYTHON BACKEND (forceful)
// =========================================================================
function killPython() {
  if (pythonProcess && pythonProcess.pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /T /PID ${pythonProcess.pid}`, { stdio: 'ignore' });
      } else {
        pythonProcess.kill('SIGKILL');
      }
    } catch (e) {}
    pythonProcess = null;
  }
}

// Also kill any zombie Python servers on our port range from previous crashes
function killZombieServers(port) {
  if (process.platform !== 'win32') return;
  try {
    const netstatOut = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf-8', timeout: 5000 });
    for (const line of netstatOut.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parseInt(parts[4], 10);
        if (pid > 0) {
          try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', timeout: 3000 }); } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

// =========================================================================
// 5. WAIT FOR SERVER — robust with long timeout & stdout/stderr monitoring
// =========================================================================
function waitForServer(port, maxAttempts = 200, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    let serverStartedLogSeen = false;

    const interval = setInterval(() => {
      attempts++;

      // Check if process died prematurely
      if (pythonProcess && pythonProcess.exitCode !== null) {
        clearInterval(interval);
        reject(new Error(`Python backend exited prematurely with code ${pythonProcess.exitCode}. Check electron_runtime.log for details.`));
        return;
      }

      const req = http.get(`http://127.0.0.1:${port}/api/status`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
        // Consume response to free socket
        res.resume();
      });

      req.on('error', () => {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error(
            `Server startup timed out after ${maxAttempts} attempts (${Math.round(maxAttempts * intervalMs / 1000)}s) on port ${port}.\n` +
            `This usually means a Python dependency is missing or the server crashed.\n` +
            `Check ${logFile} for details.`
          ));
        }
      });
      req.setTimeout(1500, () => req.destroy());
    }, intervalMs);
  });
}

// =========================================================================
// 6. START PYTHON BACKEND SERVER
// =========================================================================
async function startBackend(port) {
  const pyExe = findPython();

  // Verify Python actually works
  const versionCheck = spawnSync(pyExe === 'py' ? 'py' : pyExe,
    pyExe === 'py' ? ['-3', '--version'] : ['--version'],
    { encoding: 'utf-8', timeout: 10000, windowsHide: true }
  );
  if (versionCheck.status !== 0) {
    throw new Error(
      'Python 3 is not installed or not accessible.\n\n' +
      'Please install Python 3.10+ from https://www.python.org/downloads/\n' +
      'Make sure to check "Add Python to PATH" during installation.'
    );
  }
  const pythonVersion = (versionCheck.stdout || '').trim();
  log(`Python version: ${pythonVersion}`);

  // Build the actual python executable args (handle 'py -3' launcher)
  const pyCmd = pyExe === 'py' ? 'py' : pyExe;
  const pyPrefix = pyExe === 'py' ? ['-3'] : [];

  // Ensure dependencies are installed
  const actualPyExe = pyExe === 'py' ? (() => {
    // Resolve actual path from py launcher
    try {
      const r = execSync('py -3 -c "import sys; print(sys.executable)"', { encoding: 'utf-8', timeout: 10000 }).trim();
      return r;
    } catch (e) { return 'python'; }
  })() : pyExe;
  ensurePythonDeps(actualPyExe);

  // Locate server.py
  let serverScript = path.join(__dirname, 'server.py');
  if (!fs.existsSync(serverScript)) {
    if (fs.existsSync(path.join(RES_DIR, 'server.py'))) {
      serverScript = path.join(RES_DIR, 'server.py');
    } else if (fs.existsSync(path.join(APP_DIR, 'server.py'))) {
      serverScript = path.join(APP_DIR, 'server.py');
    }
  }

  const backendCwd = path.dirname(serverScript);
  const pyArgs = [...pyPrefix, serverScript, '--port', String(port)];
  if (isSetupMode) {
    pyArgs.push('--setup');
  }
  log(`Spawning backend: "${pyCmd}" ${pyArgs.join(' ')} (cwd: ${backendCwd})`);

  // Kill any zombie servers that may be occupying the port
  killZombieServers(port);

  pythonProcess = spawn(pyCmd, pyArgs, {
    cwd: backendCwd,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });

  pythonProcess.stdout.on('data', (d) => {
    log(`[Backend stdout] ${d.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (d) => {
    log(`[Backend stderr] ${d.toString().trim()}`);
  });

  pythonProcess.on('error', (err) => {
    log(`[Backend spawn error] ${err.message}`);
  });

  pythonProcess.on('exit', (code) => {
    log(`Backend process exited with code ${code}`);
    pythonProcess = null;
  });

  await waitForServer(port);
  log(`Backend verified and responsive on http://127.0.0.1:${port}`);
}

// =========================================================================
// 7. PRELOAD SAMPLE FILES
// =========================================================================
function preloadSamples(port) {
  let samplesDir = path.join(__dirname, 'samples');
  if (!fs.existsSync(samplesDir)) {
    if (fs.existsSync(path.join(RES_DIR, 'samples'))) {
      samplesDir = path.join(RES_DIR, 'samples');
    } else if (fs.existsSync(path.join(APP_DIR, 'samples'))) {
      samplesDir = path.join(APP_DIR, 'samples');
    }
  }
  if (!fs.existsSync(samplesDir)) return;

  try {
    const files = fs.readdirSync(samplesDir);
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (['.docx', '.pdf', '.txt', '.md', '.rtf', '.html'].includes(ext)) {
        const fullP = path.join(samplesDir, f);
        const data = JSON.stringify({ path: fullP });

        const req = http.request({
          hostname: '127.0.0.1',
          port: port,
          path: '/api/ingest-path',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        });
        req.on('error', () => {});
        req.write(data);
        req.end();
      }
    }
  } catch (e) {
    log(`Preload samples note: ${e.message}`);
  }
}

// =========================================================================
// 8. CREATE ELECTRON WINDOW
// =========================================================================
function createWindow(port) {
  const candidateIcons = [
    path.join(__dirname, 'icon.ico'),
    path.join(RES_DIR, 'icon.ico'),
    path.join(APP_DIR, 'icon.ico'),
    path.join(__dirname, 'icon.png'),
    path.join(RES_DIR, 'icon.png'),
    path.join(APP_DIR, 'icon.png'),
    path.join(__dirname, 'web', 'icon.png'),
  ];
  let windowIcon = undefined;
  for (const p of candidateIcons) {
    if (fs.existsSync(p)) {
      try {
        windowIcon = nativeImage.createFromPath(p);
        log(`Using native window icon from: ${p}`);
        break;
      } catch (e) {
        log(`Icon load error for ${p}: ${e.message}`);
      }
    }
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    title: 'Duino Humanizer',
    icon: windowIcon,
    backgroundColor: '#0a0b0d',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false,
    }
  });

  // Anti-Inspection & Anti-DevTools Protection in Electron Process
  mainWindow.setMenu(null);
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isMac = process.platform === 'darwin';
    const ctrlKey = isMac ? input.meta : input.control;
    if (
      input.key === 'F12' ||
      (ctrlKey && input.shift && ['I', 'J', 'C', 'i', 'j', 'c'].includes(input.key)) ||
      (ctrlKey && ['U', 'u', 'S', 's'].includes(input.key))
    ) {
      event.preventDefault();
    }
  });

  let appUrl = `http://127.0.0.1:${port}`;
  if (isUninstallMode) {
    appUrl += '?uninstall=1';
  } else if (isSetupMode) {
    appUrl += '?setup=1';
  }
  log(`Loading app URL: ${appUrl}`);
  mainWindow.loadURL(appUrl);

  const onWindowReady = () => {
    mainWindow.show();
    mainWindow.focus();
    log('Main Electron window visible and focused.');

    if (isSmokeTest) {
      log('[SMOKE TEST SUCCESS] Electron window initialized successfully! Exiting test cleanly.');
      setTimeout(() => {
        app.quit();
      }, 1500);
    }
  };

  mainWindow.once('ready-to-show', onWindowReady);
  mainWindow.webContents.once('did-finish-load', () => {
    if (isSmokeTest) {
      setTimeout(onWindowReady, 1000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =========================================================================
// APPLICATION LIFECYCLE
// =========================================================================
app.whenReady().then(async () => {
  log('========================================================');
  log('  CHECKER PRO • DUINO HUMANIZER (ELECTRON SOFTWARE)');
  log('  Architected and Fully Developed by J.D | Duino Inc');
  log('========================================================');

  try {
    const port = await findAvailablePort(8505);
    await startBackend(port);
    preloadSamples(port);
    createWindow(port);
  } catch (err) {
    log(`Startup error: ${err.message}`);
    killPython();
    dialog.showErrorBox(
      'Duino Humanizer - Initialization Error',
      `Failed to start local backend engine:\n${err.message}\n\n` +
      'Troubleshooting:\n' +
      '1. Install Python 3.10+ from https://python.org/downloads\n' +
      '2. Check "Add Python to PATH" during installation\n' +
      '3. Run: pip install playwright reportlab python-docx pymupdf beautifulsoup4\n' +
      '4. Run: python -m playwright install chromium\n' +
      `5. Check logs at: ${logFile}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  killPython();
  app.quit();
});

app.on('before-quit', () => {
  killPython();
});

app.on('will-quit', () => {
  killPython();
});

process.on('SIGINT', () => {
  killPython();
  process.exit(0);
});

process.on('SIGTERM', () => {
  killPython();
  process.exit(0);
});
