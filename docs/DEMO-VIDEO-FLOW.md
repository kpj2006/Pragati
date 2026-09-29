# PRAGATI demo video: shot-by-shot recording flow

**Target length:** about 3:20 (about 450 words of voiceover)
**Story:** an entrepreneur hands PRAGATI a folder of documents. The agent works out the approval journey, prepares the applications, catches the mistakes, remembers the deadlines and keeps going on its own. The applicant only approves, and the department receives cleaner applications.
**Tagline:** *From submitting to delegating.*

Everything below was checked against a live end-to-end run of the app with Gemini. The agent's wording changes a little on every run; the steps and screens don't.

---

## 1. Before you record

### Setup (once)

1. In the `pragati-industrial-orchestration` folder, check that `.env` contains `GEMINI_API_KEY=...`.
2. Run `npm install` (first time only), then `npm start`, and leave the terminal open.
3. Open **http://localhost:4183** in Chrome.
4. Set browser zoom to **110–125%** so text is readable in the video, and hide the bookmarks bar.

### Before every take

- [ ] Profile menu (top right) → **Reset demo data** → **Reset demo**. The app returns to a clean Home page.
- [ ] Open `assets/sample-docs/fixes/` in a file-explorer window, ready to drag from. It holds the corrected documents for scene 7.
- [ ] Check that the header status pill on the Agent Mode page shows **Agent Mode on · gemini-…**.
- [ ] Do one full rehearsal before the real take.

### Gemini quota: read this before recording day

The API key has request limits. When Google is busy, or the key has hit its per-minute or per-day limit, the server automatically retries and falls back to another Gemini model (3.8 → 3.7 → 3.6 → 3.5 → 3.5-flash-lite). A step that normally takes 30–60 seconds can then take 2–3 minutes. That's fine, because you'll cut the waiting in editing.

- Do **one rehearsal plus one or two takes** per session. Each full take makes about 15–25 model requests.
- If a step stalls or shows *Gemini is under heavy demand*, wait a minute and press the same button again.
- Recording off-peak (early morning or late night IST) is noticeably faster.
- To pin one model that you know is responding, add `GEMINI_MODEL=gemini-3.7-flash` (for example) to `.env` and restart `npm start`.

---

## 2. The flow at a glance

| # | Scene | Time | Main click | What the judges see |
|---|---|---|---|---|
| 1 | The problem | 0:00–0:15 | (title card) | 17 approvals, 8+ departments |
| 2 | PRAGATI home | 0:15–0:25 | **✦ Delegate my approvals** | Single-window portal plus Agent Mode |
| 3 | Hand over | 0:25–0:40 | **Load sample document pack** | Six documents, handed over once |
| 4 | Delegate | 0:40–1:10 | **✦ Delegate 6 documents** | Live agent activity feed |
| 5 | What it found | 1:10–1:45 | **Review draft** | Defects caught, deadlines found, fields traced to sources |
| 6 | Human approval | 1:45–2:00 | **Approve all** | The agent never submits alone |
| 7 | Fix it | 2:00–2:25 | **Upload fix** → **Delegate** | Signed plan re-checked, Fire NOC unblocked |
| 8 | Time passes | 2:25–2:50 | **Done** on the deposit → **Fast-forward 30 days** | Approvals arrive and the agent follows up by itself |
| 9 | Department view | 2:50–3:10 | **Via Agent** tab | Clean applications in the officer's queue |
| 10 | Close | 3:10–3:20 | (roadmap, then title card) | From submitting to delegating |

---

## 3. Scene by scene

### Scene 1: The problem (0:00–0:15)

**Screen:** a title card on a dark background.
**On-screen text:** *To open one chemical factory in Maharashtra: 17 approvals · 8+ departments · dozens of forms · deadlines everywhere.*

**Voiceover:**
> "Opening a factory in India isn't one application. It's a chain of them: pollution consent, fire NOC, factory licence, water, boilers. Each depends on another, each needs the same documents again, and each has a deadline hidden in a letter somewhere."

### Scene 2: PRAGATI home (0:15–0:25)

**Click:** nothing at first. Scroll slowly to the gold **Agent Mode on NSWS** banner, then click **✦ Delegate my approvals →**.

**Voiceover:**
> "PRAGATI sits on top of the National Single Window System. Its new Agent Mode changes the model: from submitting to delegating."

### Scene 3: Hand over the documents (0:25–0:40)

**Screen:** the Agent Mode page. Pause briefly on the headline *From submitting to delegating* and the green **Agent Mode on** pill.

**Clicks:**
1. **Load sample document pack (fictional)**. Six files appear with **New** badges.
2. Optional: type in **Anything the agent should know?** → *Construction must start in October. Prioritise MPCB consent.*

**Voiceover:**
> "Mukesh wants to start a ₹35 crore chemical unit in Chakan. He gives PRAGATI what he already has: company certificate, GST, the MIDC land lease, the project report, a fire safety plan and a water allotment letter. Once."

### Scene 4: Delegate (0:40–1:10)

**Click:** **✦ Delegate 6 documents to the agent**.

**What appears:** the pill turns to **Agent working**. The **Live agent activity** feed fills with steps: *Reviewed your approval journey*, *Read Certificate_of_Incorporation.txt — Verified*, and so on, plus *Updated your project profile*, *Will remember…* and *Prepared…*. A spinner at the top shows the current action.

**Editing:** this takes 30 seconds to a few minutes. Keep about 6–8 seconds of the feed filling, then jump-cut or speed it up 4–8×. Add a small on-screen label: *Real Gemini agent · live*.

**Voiceover:**
> "One click. Now the agent reads every document, checks Mukesh's 17-approval dependency map, works out what can start today, and prepares every application it can. Each step appears live."

### Scene 5: What the agent found (1:10–1:45)

Slowly show the three results; this is the heart of the demo.

1. **Feed or My Documents:** *Fire Safety Plan — Needs attention: consultant signature not provided, stamp not affixed.* Also *Boiler manufacturer's Form II not yet received.* Zoom in on these.
2. **Deadlines I'm remembering:**
   - *MIDC water security deposit, 20 Oct 2026*: a countdown of about 23 days. The deadline was buried in the allotment letter.
   - *MIDC construction commencement, 15 Nov 2026*: about 49 days. It was clause 7.1 of the lease.
3. **Applications prepared:** Factory Plan, Water Connection and PESO show **Awaiting your approval**. Fire NOC and Boiler show **Draft · 1 to fix** with an **Upload fix** button.
4. Click **Review draft** on Industrial Water Connection. The popup shows each field, its value and the document it came from. Close it with **×** or **Esc**.

**On-screen text:** *Caught 2 defects before any department saw them* · *Found 2 hidden deadlines* · *Every field traced to its source*

**Voiceover:**
> "In about a minute the agent has caught an unsigned fire plan and a missing boiler certificate, before any department sees them. It found two deadlines hidden in the paperwork, and it prepared five applications, with every field traced to the document it came from."

### Scene 6: The human stays in control (1:45–2:00)

**Screen:** the **Needs your decision** cards.
**Click:** **Approve all**. You can click **Approve & submit (demo)** on each card instead.

**What appears:** *You approved · … submitted (demo)* entries with reference numbers such as *MH-WTR-27011*. The agent then writes SLA follow-ups into the deadline list, and a short reply appears in **Talk to your agent**.

**Voiceover:**
> "The agent never submits on its own. Mukesh approves, and the agent immediately schedules follow-ups against each department's service deadline."

### Scene 7: Fix what was flagged (2:00–2:25)

**Clicks:**
1. **Upload fix** next to **Fire NOC**, or drag the file from the explorer window onto the page.
2. Choose `assets/sample-docs/fixes/Fire_Safety_Plan_Rev2.txt`. It has the same name as the unsigned copy, so it shows as **New version**.
3. **✦ Delegate 1 document to the agent**.
4. When **Needs your decision** shows **Fire NOC**, click **Approve & submit (demo)**.

**Optional:** do the same with `fixes/Boiler_Form_II_Inspection_Certificate.txt` for Boiler Registration.

**Voiceover:**
> "When the signed plan arrives, Mukesh just drops it in. The agent re-checks it, clears the defect, and Fire NOC is ready for his approval."

### Scene 8: Time passes, and the agent keeps working (2:25–2:50)

**Clicks:**
1. In **Deadlines I'm remembering**, click **Done** on the MIDC water deposit. It turns to **✓ Done**, meaning Mukesh has paid it.
2. Click **Fast-forward 30 days**. The demo clock jumps to **27 Oct 2026**.

**What appears:**
- ★ *MPCB Consent to Establish approved*, ★ *Factory Plan Approval approved*, ★ *Industrial Water Connection approved*, ★ *Fire NOC approved* (simulated department decisions), with notifications arriving under the bell icon.
- The agent runs an **automatic check-in** without being asked. It prepares the next wave of approvals that just became unblocked: Consent to Operate, Hazardous Waste Authorisation, Environmental Clearance Screening, Joint Site Inspection and Factory Licence. Then it summarises what changed.

**Editing:** speed up the check-in wait. Zoom in on the ★ approvals and the new drafts.

**Voiceover:**
> "A month later, approvals come in. Mukesh didn't ask for anything, but the agent noticed, prepared the next wave of approvals that just unblocked, and told him what's next. This is 'keep you informed'."

### Scene 9: The department's side (2:50–3:10)

**Clicks:**
1. Profile menu → **Government / Department View**.
2. Sidebar → **My Queue** → click the **✦ Via Agent** tab.
3. Click an application ID, for example *MH-FIRE-27032*, to open its side panel. Close it with **Esc**.
4. Optional: **Smart Queue** or **Public Transparency** for 2 seconds each.

**On-screen text:** *Complete, pre-checked applications, with no back-and-forth over missing signatures.*

**Voiceover:**
> "On the officer's side, agent-prepared applications arrive complete and pre-checked. Fewer rejections, fewer queries, and a queue prioritised by SLA risk."

Switch back with profile menu → **Applicant View · Mukesh Chemicals**.

### Scene 10: Close (3:10–3:20)

**Screen:** **Approval Roadmap** (sidebar), showing the dependency graph with many nodes now green. Cut to a title card.

**On-screen text:** *PRAGATI · From submitting to delegating.* · Team [name] · Problem Statement [ID] · [demo URL]

**Voiceover:**
> "Give PRAGATI the documents. Let the agent handle the journey, remember every deadline, and keep you informed. PRAGATI: from submitting to delegating."

---

## 4. Full voiceover script (for reading while recording)

> Opening a factory in India isn't one application. It's a chain of them: pollution consent, fire NOC, factory licence, water, boilers. Each depends on another, each needs the same documents again, and each has a deadline hidden in a letter somewhere.
>
> PRAGATI sits on top of the National Single Window System. Its new Agent Mode changes the model: from submitting to delegating.
>
> Mukesh wants to start a ₹35 crore chemical unit in Chakan. He gives PRAGATI what he already has: company certificate, GST, the MIDC land lease, the project report, a fire safety plan and a water allotment letter. Once.
>
> One click. Now the agent reads every document, checks Mukesh's 17-approval dependency map, works out what can start today, and prepares every application it can. Each step appears live.
>
> In about a minute the agent has caught an unsigned fire plan and a missing boiler certificate, before any department sees them. It found two deadlines hidden in the paperwork, and it prepared five applications, with every field traced to the document it came from.
>
> The agent never submits on its own. Mukesh approves, and the agent immediately schedules follow-ups against each department's service deadline.
>
> When the signed plan arrives, Mukesh just drops it in. The agent re-checks it, clears the defect, and Fire NOC is ready for his approval.
>
> A month later, approvals come in. Mukesh didn't ask for anything, but the agent noticed, prepared the next wave of approvals that just unblocked, and told him what's next.
>
> On the officer's side, agent-prepared applications arrive complete and pre-checked. Fewer rejections, fewer queries, and a queue prioritised by SLA risk.
>
> Give PRAGATI the documents. Let the agent handle the journey, remember every deadline, and keep you informed. PRAGATI: from submitting to delegating.

---

## 5. If something goes wrong during a take

| What you see | What to do |
|---|---|
| Pill says **Agent offline · API key not configured** | Check `GEMINI_API_KEY` in `.env`, then restart `npm start` |
| Pill says **Agent server offline · run npm start** | The server isn't running; start it and refresh the page |
| Agent stays on **Agent working** for several minutes | Google is busy; the server is retrying other models. Keep waiting (you'll cut it) or pin `GEMINI_MODEL` |
| Red **Agent stopped** entry, e.g. *Gemini is under heavy demand* | Wait a minute and press the same button again (**Delegate**, **Approve**, or send a chat message) |
| Agent asks approval for a different set of drafts than expected | Fine: the agent decides from the documents each run. Approve whatever it shows |
| A file won't upload | Use PDF, image or text. Word files must be saved as PDF first |
| You want to start again | Profile menu → **Reset demo data** |

---

## 6. 90-second cut-down

Keep scenes **3 → 4 → 5 → 6 → 8**, then a 3-second close:

- 0:00–0:10 hand over the sample pack
- 0:10–0:25 Delegate, with the feed sped up
- 0:25–0:50 defects, deadlines, a draft with sources
- 0:50–1:00 Approve all
- 1:00–1:20 Fast-forward 30 days, approvals arrive, and the agent prepares the next wave
- 1:20–1:30 tagline card

---

## 7. Likely judge questions

1. **"Is the AI real?"** Yes. Documents go to Google Gemini, which reads them and drives every step through tool calls you can watch live. The department decisions and the approval catalogue are simulated for the demo.
2. **"What stops the agent from doing something wrong?"** Every submission needs the applicant's click. The app itself refuses to prepare an approval whose prerequisites aren't met, or to request submission while items are missing. Every tool call is checked before it runs, and every prepared field cites its source document.
3. **"How is this different from NSWS?"** NSWS helps you find approvals and apply. PRAGATI adds an agent that sequences the approvals, prepares the applications, catches defects before submission, remembers every deadline and follows up.
4. **"How would departments adopt it?"** Through reverse integration: departments keep their existing systems, and status flows back through adapters (see the **Department Integration** page).
5. **"What about data privacy?"** In the prototype, documents go only to the model provider, never to a department, and the API key stays on the server. Production would need consent, government-approved hosting, audit trails and a data-sharing basis (Phase 6 in [`PHASES.md`](PHASES.md)).
