/**
 * Digital Enviro — AI Tutor backend proxy
 * ----------------------------------------
 * A minimal Express server that keeps your Anthropic API key server-side
 * and exposes a single endpoint the frontend widget talks to:
 *
 *   POST /api/ask-ai   { message: string, history: [{role, content}] }
 *   -> { reply: string }
 *
 * Setup:
 *   1. cd server
 *   2. npm install
 *   3. copy .env.example to .env and add your ANTHROPIC_API_KEY
 *   4. npm start        (defaults to http://localhost:3000)
 *
 * Serve the rest of the site (the HTML/CSS/JS in the project root) from the
 * same origin as this server in production, so the widget's default
 * "/api/ask-ai" endpoint just works with no extra config.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[ai-server] Warning: ANTHROPIC_API_KEY is not set. Requests will fail until it is.');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: '200kb' }));
const path = require('path');
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT =
  'You are the Digital Enviro AI Tutor, embedded on a learning site for ' +
  'software development, AI, prompt engineering, web development, cyber ' +
  'security, cloud computing, blockchain, and machine learning. Answer ' +
  'clearly and concisely, use short fenced code examples when helpful, and ' +
  'stay focused on programming and technology education. If asked something ' +
  'unrelated, gently redirect back to what you can help with on this site.';

// Very small in-memory rate limiter (per IP) to avoid runaway API spend.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  hits.set(ip, entry);
  return entry.count > MAX_PER_WINDOW;
}

app.post('/api/ask-ai', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (rateLimited(ip)) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing "message" string in request body.' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-20)
      : [];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [...safeHistory, { role: 'user', content: message }]
    });

    const textBlock = response.content.find(block => block.type === 'text');
    res.json({ reply: textBlock ? textBlock.text : '(no reply returned)' });
  } catch (err) {
    console.error('[ai-server] /api/ask-ai error:', err.message);
    res.status(500).json({ error: 'AI Tutor is temporarily unavailable. Please try again shortly.' });
  }
});

const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[ai-server] Digital Enviro AI Tutor proxy running on http://localhost:${PORT}`);
});
