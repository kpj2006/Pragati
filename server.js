// Local development server: serves the static prototype and the /api/agent endpoint.
// Run with `npm start` (reads GEMINI_API_KEY from .env when present).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAgentRequest } from './lib/agent-handler.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 4183;
const MAX_BODY = 30 * 1024 * 1024;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.pdf': 'application/pdf' };
const publicPrefixes = ['index.html', 'styles.css', 'src' + sep, 'assets' + sep];

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api/agent') {
    let body;
    try { body = req.method === 'POST' ? await readBody(req) : undefined; }
    catch (error) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: error.message })); }
    return handleAgentRequest(req, res, body);
  }
  const rel = normalize(decodeURIComponent(pathname === '/' ? '/index.html' : pathname)).replace(/^[\\/]+/, '');
  if (!publicPrefixes.some(p => rel === p || rel.startsWith(p))) { res.writeHead(404); return res.end('Not found'); }
  try {
    const data = await readFile(join(root, rel));
    res.writeHead(200, { 'Content-Type': types[extname(rel)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(port, () => {
  console.log(`PRAGATI running at http://localhost:${port}`);
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) console.log('GEMINI_API_KEY is not set — Agent Mode will report that it is offline. Add it to .env and restart.');
});
