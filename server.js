/**
 * Ahmad Web & Automation — Local Development & Production Server
 * Features:
 * - Uses shared assistant configuration from /shared/assistant.js
 * - Static file serving restricted strictly to /public folder
 * - Health check endpoint (GET /healthz -> "ok")
 * - AI Chat endpoint (POST /api/chat) using Gemini Flash API
 * - In-memory rate limiter (20 messages/hour per IP, reading X-Forwarded-For)
 * - 10kb body size protection
 * - Standard security headers (nosniff, SAMEORIGIN, strict-origin-when-cross-origin)
 * - Zero external npm dependencies (native Node.js)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const {
  STUDIO_CONFIG,
  FALLBACK_KEY_MISSING,
  FALLBACK_RATE_LIMIT,
  callGemini
} = require('./shared/assistant.js');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

// =============================================================================
// Optional Local .env Loader (for local dev; Render/Netlify inject into env)
// =============================================================================
function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          process.env[key] = val;
        }
      });
    } catch (e) {
      // Ignore
    }
  }
}
loadLocalEnv();

// =============================================================================
// In-Memory Rate Limiter (Max 20 messages per visitor per hour)
// =============================================================================
const visitorRateLimits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const timestamps = (visitorRateLimits.get(ip) || []).filter(t => t > oneHourAgo);
  if (timestamps.length >= 20) {
    visitorRateLimits.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  visitorRateLimits.set(ip, timestamps);
  return false;
}

// Clean stale rate limit entries every 15 minutes
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [ip, list] of visitorRateLimits.entries()) {
    const valid = list.filter(t => t > oneHourAgo);
    if (valid.length === 0) {
      visitorRateLimits.delete(ip);
    } else {
      visitorRateLimits.set(ip, valid);
    }
  }
}, 15 * 60 * 1000);

// =============================================================================
// MIME Types
// =============================================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// =============================================================================
// HTTP Server
// =============================================================================
const server = http.createServer(async (req, res) => {
  // Apply standard security headers to every response
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = (req.url || '/').split('?')[0];

  // ---------------------------------------------------------------------------
  // Route: GET /healthz (Health Check)
  // ---------------------------------------------------------------------------
  if (req.method === 'GET' && reqUrl === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }

  // ---------------------------------------------------------------------------
  // Route: POST /api/chat
  // ---------------------------------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/chat') {
    let body = '';
    let isOversized = false;

    // Body limit: 10kb
    const MAX_BODY_SIZE = 10 * 1024;

    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        isOversized = true;
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Payload too large (max 10kb)' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      if (isOversized) return;

      // Extract client IP behind proxy (first entry in X-Forwarded-For)
      const xForwardedFor = req.headers['x-forwarded-for'];
      const clientIp = (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : '') ||
                       req.socket.remoteAddress ||
                       '127.0.0.1';

      // 1. Rate limit check (max 20/hr)
      if (isRateLimited(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply: FALLBACK_RATE_LIMIT }));
        return;
      }

      // 2. Parse request JSON
      let parsed = {};
      try {
        parsed = JSON.parse(body || '{}');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON request' }));
        return;
      }

      const userMessage = (parsed.message || '').trim().slice(0, 400);
      const history = Array.isArray(parsed.history) ? parsed.history.slice(-6) : [];

      if (!userMessage) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Message cannot be empty' }));
        return;
      }

      // 3. Read API Key (Strictly from environment, never logged)
      loadLocalEnv();
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();

      if (!apiKey || apiKey === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply: FALLBACK_KEY_MISSING }));
        return;
      }

      // 4. Call Gemini Flash API via shared module
      try {
        const geminiReply = await callGemini(apiKey, userMessage, history);
        if (geminiReply) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ reply: geminiReply }));
          return;
        }
      } catch (err) {
        // Fall through to fallback reply
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ reply: FALLBACK_KEY_MISSING }));
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // Static File Serving (Restricted Strictly to /public)
  // ---------------------------------------------------------------------------
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
    return;
  }

  // Block any path containing dotfiles (e.g. /.env, /.git, /.gitignore)
  if (reqUrl.includes('/.')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const relativePath = reqUrl === '/' ? 'index.html' : reqUrl.replace(/^\/+/, '');
  const normalizedPath = path.normalize(relativePath);

  // Prevent directory traversal attacks
  const safeFilePath = path.join(PUBLIC_DIR, normalizedPath);
  if (!safeFilePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  fs.stat(safeFilePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safeFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Cache control: HTML no-cache for instant updates, static assets cached 1 hour
    const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=3600';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(safeFilePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/ (public dir: ${PUBLIC_DIR})`);
});
