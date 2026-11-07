#!/usr/bin/env node
// =========================================================================
// Duino Humanizer • Zero-Dependency Local Dev Server & API Runtime
// Emulates Vercel Serverless Functions + Static Asset Serving
// Author: J.D | Duino Inc
// =========================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

// Force Playwright browser automation on local dev server
process.env.USE_PLAYWRIGHT = '1';

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'web');
const API_DIR = path.join(ROOT_DIR, 'api');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Polyfill Vercel/Express-like response methods
function enhanceResponse(res) {
  if (!res.status) {
    res.status = function (code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function (data) {
      if (!this.headersSent) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      this.end(JSON.stringify(data));
      return this;
    };
  }
  return res;
}

// Parse request body
function parseRequestBody(req) {
  return new Promise((resolve) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      req.body = {};
      return resolve();
    }
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        req.body = raw ? JSON.parse(raw) : {};
      } catch (err) {
        req.body = raw;
      }
      resolve();
    });
    req.on('error', () => {
      req.body = {};
      resolve();
    });
  });
}

// Find static file across root and web/ directory
function resolveStaticFile(pathname) {
  let relative = pathname.replace(/^\/+/, '');
  if (!relative || relative === '') relative = 'index.html';

  // Security: prevent directory traversal
  const safePath = path.normalize(relative).replace(/^(\.\.[\/\\])+/, '');

  const candidates = [
    path.join(ROOT_DIR, safePath),
    path.join(WEB_DIR, safePath),
    path.join(ROOT_DIR, 'web', safePath)
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const stat = fs.statSync(c);
      if (stat.isFile()) return c;
      if (stat.isDirectory()) {
        const indexHtml = path.join(c, 'index.html');
        if (fs.existsSync(indexHtml) && fs.statSync(indexHtml).isFile()) {
          return indexHtml;
        }
      }
    }
  }

  // Fallback to index.html for SPA routing (cleanUrls / rewrites)
  if (!path.extname(safePath) || path.extname(safePath) === '.html') {
    const rootIndex = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(rootIndex)) return rootIndex;
    const webIndex = path.join(WEB_DIR, 'index.html');
    if (fs.existsSync(webIndex)) return webIndex;
  }

  return null;
}

// Discover available API handlers in /api
function getApiHandler(endpointName) {
  const cleanName = endpointName.replace(/^\/api\//, '').replace(/\.js$/, '');
  const candidates = [
    path.join(API_DIR, `${cleanName}.js`),
    path.join(API_DIR, cleanName, 'index.js')
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      try {
        // Clear cache for API and Paraphraser modules for live hot-reloading
        Object.keys(require.cache).forEach(k => {
          if (k.includes('paraphraser') || k.includes('api')) {
            delete require.cache[k];
          }
        });
        return require(file);
      } catch (err) {
        console.error(`[API Error] Failed to require ${file}:`, err.message);
        return null;
      }
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  // Common CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Duino-Shield, X-Duino-Timestamp, X-Duino-Nonce, X-Duino-Signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname || '/';

  // 1. Handle API Endpoints (/api/*)
  if (pathname.startsWith('/api/')) {
    await parseRequestBody(req);

    const handler = getApiHandler(pathname);
    if (handler && typeof handler === 'function') {
      try {
        await handler(req, res);
      } catch (err) {
        console.error(`[API Exception] ${pathname}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error in dev API runner', details: err.message });
        }
      }
      return;
    } else {
      res.status(404).json({ error: `API endpoint '${pathname}' not found in /api directory.` });
      return;
    }
  }

  // 2. Handle Static Files
  const filePath = resolveStaticFile(pathname);
  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-cache');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return;
  }

  // 3. 404 Fallback
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(`404 Not Found: ${pathname}`);
});

function openBrowser(urlStr) {
  const startCmd = process.platform === 'win32'
    ? `start "" "${urlStr}"`
    : process.platform === 'darwin'
      ? `open "${urlStr}"`
      : `xdg-open "${urlStr}"`;
  exec(startCmd, () => {});
}

server.listen(PORT, '0.0.0.0', () => {
  const localUrl = `http://localhost:${PORT}`;
  console.log('======================================================================');
  console.log('Duino Humanizer • Local Development Server');
  console.log('======================================================================');
  console.log(`Local URL:    ${localUrl}`);
  console.log(`Network URL:  http://127.0.0.1:${PORT}`);
  console.log('');
  console.log('Mounted API Endpoints:');
  try {
    const apis = fs.readdirSync(API_DIR).filter(f => f.endsWith('.js'));
    apis.forEach(f => console.log(`  - /api/${f.replace(/\.js$/, '')}`));
  } catch (e) {}
  console.log('');
  console.log('Zero External Dependencies • Live Reloading for API & Frontend');
  console.log('Ready for text humanization, ZeroGPT loops, and export testing.');
  console.log('Press Ctrl+C to terminate.');
  console.log('======================================================================');

  if (process.argv.includes('--open')) {
    openBrowser(localUrl);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is currently in use. Set PORT=3001 or kill the existing process.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
