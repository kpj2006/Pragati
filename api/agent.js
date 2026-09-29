// Vercel serverless entry point. Vercel parses JSON bodies into req.body.
import { handleAgentRequest } from '../lib/agent-handler.js';

export default function handler(req, res) {
  return handleAgentRequest(req, res, req.body);
}
