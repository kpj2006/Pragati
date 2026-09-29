# PRAGATI implementation phases

The prototype phases below describe delivered demonstration scope. Phase 6 is a production roadmap, not an implemented capability.

## Phase 1 — Applicant and officer foundation

- Responsive government-service interface with applicant/officer workspace switching.
- Route-aware navigation, demonstration data notices, persistent browser state and contextual Agent Mode shell.
- Demo profiles: Mukesh Chemicals Pvt. Ltd. and Rahul Foods.

## Phase 2 — Know Your Approvals and dependency model

- Four-step structured KYA intake covering project identity, scale, pollution category and requirements.
- Project-specific approval list and 17-node industrial dependency graph.
- Status vocabulary for completed, ready, in-review, delayed and dependency-blocked nodes.
- Node detail drawers provide sample owner, prerequisites, document checklist, SLA and next action.
- Sequential/parallel estimates are illustrative; roadmap can be exported as JSON.

## Phase 3 — Applicant execution workspace

- Readiness summary and approval launch actions.
- Application preparation wizard that creates only a local draft.
- Document register with simulated metadata checks and a deliberately visible signature-validation exception.
- Verified information, schemes, renewal, notifications and escalation draft modules.
- Uploaded binary data is not persisted or transmitted.

## Phase 4 — Department operations

- Work queue with search, filtering, sorting and CSV export.
- Application context, priority proposal, sample SLA clocks and dependency impact.
- Joint inspection proposal, operational analytics and public status transparency view.
- All actions update only browser-side sample state.

## Phase 5 — Trust and governance demonstration

- Knowledge records expose source-verification and human-review interactions.
- Notification centre and reverse-integration status surfaces demonstrate the intended interaction model.
- Risk and precedent modules are framed as decision support; human officers retain authority.
- Demo data and unsupported capabilities are disclosed throughout.

## Phase 5A — Agent Mode: from submitting to delegating

- Applicant hands over documents (PDF, images or text) once; a Gemini agent reads them into the vault with extracted identifiers, dates and defects.
- Agent reviews the dependency roadmap, updates the project profile and prepares an application draft for every ready approval, citing a source document for each field and listing missing items.
- Submissions wait for an explicit applicant approval; approved demo submissions appear in the officer queue.
- Agent remembers deadlines (expiries, payment windows, conditions, SLA follow-ups) and sends notifications.
- Corrected documents replace earlier versions and are re-checked; a demo clock simulates department decisions and triggers an automatic agent check-in.
- Server-side key handling, model selection with retry and fallback across Gemini models, and client-side validation of every tool call.

## Phase 6 — Production implementation (not included)

A production implementation would need: government identity federation and role-based access; authoritative approval rules with effective dates and citations; consent-based data exchange; department-owned APIs/adapters; encrypted document/object storage; real OCR with confidence and human correction; audit trails; records retention; availability and incident monitoring; accessibility and security review; and agency-approved hosting. Do not enable legal decisions or automatically submit applications until the responsible authorities approve the source data, workflow, accountability and operating model.
