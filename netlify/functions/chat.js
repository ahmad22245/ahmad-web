/**
 * Ahmad Web & Automation — Netlify Function: AI Chat Endpoint
 * Path: /api/chat
 * Modern Netlify Function format (Web API Request/Response)
 */

import assistantPkg from '../../shared/assistant.js';

const {
  STUDIO_CONFIG,
  FALLBACK_KEY_MISSING,
  FALLBACK_RATE_LIMIT,
  callGemini
} = assistantPkg;

// Best-effort in-memory rate limiter per warm container
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

export default async function handler(req, context) {
  // Security & JSON response headers
  const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  // 1. Only accept POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...jsonHeaders, 'Allow': 'POST' }
    });
  }

  // 2. Reject payloads larger than 10kb (10240 bytes)
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > 10 * 1024) {
    return new Response(JSON.stringify({ error: 'Payload too large (max 10kb)' }), {
      status: 413,
      headers: jsonHeaders
    });
  }

  let bodyText = '';
  try {
    bodyText = await req.text();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to read request body' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  if (bodyText.length > 10 * 1024) {
    return new Response(JSON.stringify({ error: 'Payload too large (max 10kb)' }), {
      status: 413,
      headers: jsonHeaders
    });
  }

  // 3. Best-effort rate limiting using context.ip or X-Forwarded-For
  const clientIp = context?.ip ||
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ reply: FALLBACK_RATE_LIMIT }), {
      status: 429,
      headers: jsonHeaders
    });
  }

  // 4. Parse JSON payload
  let parsed = {};
  try {
    parsed = JSON.parse(bodyText || '{}');
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  const userMessage = (parsed.message || '').trim().slice(0, 400);
  const history = Array.isArray(parsed.history) ? parsed.history.slice(-6) : [];

  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  // 5. Read Gemini API key (from Netlify.env or process.env, never logged or returned)
  let apiKey = '';
  try {
    if (typeof Netlify !== 'undefined' && Netlify.env && typeof Netlify.env.get === 'function') {
      apiKey = (Netlify.env.get('GEMINI_API_KEY') || '').trim();
    }
  } catch (e) {
    // Ignore
  }

  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = (process.env.GEMINI_API_KEY || '').trim();
  }

  if (!apiKey || apiKey === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return new Response(JSON.stringify({ reply: FALLBACK_KEY_MISSING }), {
      status: 200,
      headers: jsonHeaders
    });
  }

  // 6. Call Gemini Flash API via shared module
  try {
    const geminiReply = await callGemini(apiKey, userMessage, history);
    if (geminiReply) {
      return new Response(JSON.stringify({ reply: geminiReply }), {
        status: 200,
        headers: jsonHeaders
      });
    }
  } catch (err) {
    // Fall through to fallback
  }

  return new Response(JSON.stringify({ reply: FALLBACK_KEY_MISSING }), {
    status: 200,
    headers: jsonHeaders
  });
}

export const config = {
  path: '/api/chat'
};
