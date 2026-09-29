// Shared HTTP handler for /api/agent, used by server.js locally and api/agent.js on Vercel.
// GET  → agent status and tool schemas (the browser validates tool inputs against them).
// POST → one Gemini turn, streamed back as newline-delimited JSON events.
import { TOOLS, isConfigured, resolveModel, runAgentTurn, describeError } from './agent-core.js';

const MAX_MESSAGES = 400;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function authorised(req) {
  const code = process.env.AGENT_ACCESS_CODE;
  return !code || req.headers['x-agent-access'] === code;
}

export async function handleAgentRequest(req, res, body) {
  if (req.method === 'GET') {
    return sendJson(res, 200, { configured: isConfigured(), model: await resolveModel(), accessCodeRequired: Boolean(process.env.AGENT_ACCESS_CODE), tools: TOOLS });
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!authorised(req)) return sendJson(res, 401, { error: 'Agent access code required.' });
  if (!isConfigured()) return sendJson(res, 503, { error: 'GEMINI_API_KEY is not set on the server. Add it to .env (local) or the Vercel project settings.' });

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES || messages.at(-1)?.role !== 'user') {
    return sendJson(res, 400, { error: 'Body must be {messages: [...]} ending with a user message.' });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');
  const emit = event => res.write(JSON.stringify(event) + '\n');
  const abort = new AbortController();
  res.on('close', () => { if (!res.writableEnded) abort.abort(); });

  // Keep-alive for proxies and long model waits; the browser ignores ping events.
  const ping = setInterval(() => emit({ type: 'ping' }), 15000);
  try {
    const message = await runAgentTurn(messages, emit, abort.signal);
    emit({ type: 'message', message });
  } catch (error) {
    if (!abort.signal.aborted) {
      const { status, message } = describeError(error);
      console.error(`[agent] ${status}: ${message}`);
      emit({ type: 'error', status, message });
    }
  }
  clearInterval(ping);
  res.end();
}
