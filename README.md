# PRAGATI | Industrial Approval & Compliance Orchestrator

A browser-based, multi-role prototype for discovering, preparing and tracking industrial approvals. PRAGATI models an applicant workspace and a department operations workspace with a dependency-aware approval roadmap.

> **Demonstration software.** PRAGATI is not an official government service. Applicant records, approval applicability, processing durations, SLAs, risk indicators, status events and department workflows are illustrative. There is no sign-in, official portal integration, application transmission or government notification. **Agent Mode** sends the documents you hand over to Google Gemini through PRAGATI's server so the agent can read them; nothing is sent to a government department, and "submissions" are demo records only. The classic document-vault upload records metadata only. Confirm requirements and deadlines with the competent authority.

## Agent Mode — "From submitting to delegating"

*Give PRAGATI the documents. Let the agent handle the journey, remember every deadline, and keep you informed.*

Open **Agent Mode** (header button, home banner or sidebar). Hand over documents (PDF, images or text) or load the fictional sample pack, then press **Delegate**. A Gemini-powered agent:

1. reads each document into the vault, extracting identifiers and dates and flagging defects (for example, the unsigned fire safety plan in the sample pack);
2. updates the project profile and reviews the 17-node dependency roadmap;
3. prepares an application draft for every approval that is ready, with each field traced to its source document;
4. asks your approval before any submission (approved submissions appear in the officer's **My Queue**);
5. remembers every deadline (expiries, payment windows, construction conditions, SLA follow-ups) and notifies you.

**Fast-forward 7 / 30 days** moves a demo clock: simulated department decisions unblock new approvals, reminders fire, and the agent runs a check-in to act on what changed.

The agent loop runs in the browser against the prototype state. [`lib/agent-core.js`](lib/agent-core.js) holds the model, system prompt and tool catalogue server-side, and [`src/agent.js`](src/agent.js) executes the tools. The API key never reaches the browser.

## Run locally

Requires Node.js 20.12 or later.

```sh
npm install
cp .env.example .env      # then set GEMINI_API_KEY (from https://aistudio.google.com/apikey)
npm start
```

Open <http://localhost:4183>. Prototype state persists in browser `localStorage`. Without an API key, everything except Agent Mode still works, and Agent Mode reports that it is offline. The static pages also still run from any HTTP server (`python3 -m http.server 4183`), but Agent Mode needs `npm start`.

## Demonstration paths

- **Applicant · Mukesh Chemicals Pvt. Ltd.** Open **Know Your Approvals**, submit a chemical-manufacturing profile, explore its 17 illustrative approval nodes and start a local application draft.
- **Applicant · Rahul Foods** In the KYA flow select **Food Processing** and **Green** to build the small-business demonstration roadmap.
- **Department officer** Use the profile menu to switch workspaces and inspect the sample queue, applicant case, smart queue, analytics, SLA and transparency views.
- **Agent Mode (recommended demo)** Hand over the sample document pack, press **Delegate**, approve submissions, fix what the agent flags and fast-forward the demo clock. The walkthrough is in [`docs/DEMO-VIDEO-FLOW.md`](docs/DEMO-VIDEO-FLOW.md) and [`docs/USER-JOURNEY.md`](docs/USER-JOURNEY.md). Use **Reset demo data** in the profile menu before each take.

## Phase plan

| Phase | Scope | Status |
|---|---|---|
| 1 · Applicant foundation | Government-service visual system, responsive shell, role workspaces, demo navigation and local state | Implemented |
| 2 · Approval discovery | Multi-step KYA, project profile and dependency roadmap with readiness, blockers, parallel paths and export | Implemented |
| 3 · Application preparation | Local application wizard, reusable document metadata, simulated validation, verified-data, scheme and renewal views | Implemented |
| 4 · Department operations | Review queue, applicant case, priority proposal, inspection proposal, SLA, risk, analytics and transparency | Implemented |
| 5 · Trust and governance | Human review, knowledge catalogue, notification events, reverse-integration mock and demo disclosures | Implemented |
| 5A · Agent Mode | Gemini agent that reads handed-over documents, prepares applications, gates submissions on applicant approval, remembers deadlines, notifies, and checks in as the demo clock advances | Implemented (prototype; simulated submissions and department decisions) |
| 6 · Production integration | Identity, permissioned data exchange, authoritative approval catalogue, department adapters, secure document storage, OCR, audit and monitoring | Not implemented; requires approved agency systems, data agreements, security design and hosting |

See [`docs/PHASES.md`](docs/PHASES.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DEMO-DATA.md`](docs/DEMO-DATA.md).

## Technology

- Semantic HTML5 and responsive CSS
- Native JavaScript ES modules in the browser (no build step)
- Node.js server with the Google Gen AI SDK (`@google/genai`) for Agent Mode: Gemini function calling with client-executed tools, thought summaries and preserved thought signatures
- Model selection: `GEMINI_MODEL` if set, otherwise the newest stable Gemini Flash models your key can use, with automatic retry and fallback when a model is busy (503/429)
- Client-side route rendering and localStorage persistence
- Static hosting compatible with Vercel, GitHub Pages or any HTTP server

## Deploy to Vercel

Import this repository in Vercel with framework preset **Other**, using the repository root as the project root and leaving the build and output commands empty. Set `GEMINI_API_KEY` in *Project Settings → Environment Variables*. For a public URL, also set `AGENT_ACCESS_CODE` so only people you give the code to can run the agent against your key. `vercel.json` lists exactly what is deployed: `api/agent.js` as a serverless function and `index.html`, `styles.css`, `src/` and `assets/` as static files. This stops Vercel from treating the local `server.js` as the app's backend, which makes every page return 404. The function's time limit is your project's default (300 s on current Vercel plans with Fluid compute; check *Settings → Functions* if agent turns time out). Vercel limits request bodies to about 4.5 MB, so hand over large PDFs locally or in smaller batches. A turn that has to wait out busy Gemini models can exceed the function's duration limit on the Hobby plan; if that happens, set `GEMINI_MODEL` to one model that is responding.

## Sources and boundaries

The discovery concept is inspired by the National Single Window System's public-facing approval discovery workflow. This prototype is an independent demonstration and is not affiliated with NSWS or any government department. The application does not scrape or claim to reproduce an authoritative approval catalogue. All presented rules and data require verification before real use.
