# Architecture

## Current prototype

```text
Browser
├── index.html              Static application shell
├── styles.css              Responsive presentation layer
├── src/app.js              Route rendering, demo data, interactions
├── src/agent.js            Agent Mode UI, agent loop and tool execution against prototype state
└── localStorage            Fictional applicant-side demonstration state
Server (server.js locally, api/agent.js on Vercel)
└── lib/agent-core.js       Gemini model selection, system prompt and tool catalogue; streams one turn per request
```

Agent Mode loop: the browser sends the conversation (including handed-over documents) to `/api/agent`. The server translates that provider-neutral history into Gemini contents (functionCall and functionResponse parts, with Gemini's thought signatures kept in a hidden block and sent back unchanged). It calls Gemini and streams progress events back, followed by the assistant message. Busy models are retried without streaming, then the next model is tried. The browser validates each tool call against the server's schemas, executes it against local state (vault, profile, drafts, pending decisions, deadlines, notifications), and returns the tool results on the next request. Submissions are gated on an explicit applicant click, and the demo clock simulates department decisions. The API key exists only on the server. There is no database, authentication provider, document bucket or department integration. Document bytes stay in browser memory for the session only.

## Domain concepts represented

- **Project profile** — applicant and project characteristics collected through KYA.
- **Approval catalogue** — illustrative nodes with departments, dependencies, document hints and sample durations.
- **Dependency graph** — approval edges determine readiness and parallel work opportunities.
- **Application draft** — local wizard state without an authority submission.
- **Document metadata** — sample type, expiry, status and validation message; no file content storage.
- **Case event** — fictional timeline entries shown in applicant and officer views.
- **Officer work item** — synthetic queue row, SLA indicator and human-controlled action proposal.

## Intended production boundaries

Separate identity, applicant profile, approval catalogue, case orchestration, document management and notification services. Treat each department as the authority for its own status and requirements. Use versioned, sourced rules with effective dates; represent unknown applicability explicitly; and retain human review for extracted or disputed information. Every cross-agency integration requires an approved data-sharing basis, consent model, least-privilege authorization, traceable audit events, retention policy and failure/reconciliation plan.

The prototype's estimates and classifications are presentation data, not an executable regulatory rules engine. A production risk model requires approved features, bias assessment, explainability, monitoring, appeal and officer override controls.
