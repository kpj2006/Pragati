# Opening a factory with PRAGATI Agent Mode: the complete user journey

> **From submitting to delegating.** Give PRAGATI the documents. Let the agent handle the journey, remember every deadline, and keep you informed.

This walkthrough follows one user from start to finish. You are **Mukesh Sharma**, Managing Director of **Mukesh Chemicals Pvt. Ltd.** You want to open a speciality chemical plant on Plot 18, Chakan MIDC, Pune. The plant is Red category, costs ₹35 crore and will employ 150 people.

Normally you would work out which of 17 approvals apply to you, fill each form by hand, re-upload the same documents again and again, and track every deadline in a spreadsheet. In Agent Mode you hand over your documents once, and the agent does the rest. You only step in to approve submissions and fix what it flags.

> **Prototype notice.** PRAGATI is a demonstration, not an official government service. The company, documents, approval rules, durations and department decisions are fictional or simulated. Documents you hand to the agent are sent to Google Gemini so it can read them. Nothing is sent to a government department, and "submissions" are demo records only.

---

## The journey at a glance

```text
 1. Open PRAGATI            →  2. Switch on Agent Mode
 3. Hand over documents     →  4. Delegate
 5. Watch the agent work    →  6. Review what it found
 7. Approve submissions     →  8. Fix what it flagged
 9. Time passes (demo)      → 10. The agent follows up by itself
11. See it from the department's side
12. Keep going until the unit is ready to operate
```

| Stage | What you do | What the agent does |
|---|---|---|
| Hand over | Drop in documents once | Reads every page, extracts identifiers, dates and defects |
| Plan | Nothing | Checks the 17-approval dependency map and finds what's ready now |
| Prepare | Nothing | Fills an application for every ready approval, citing a source document for each field |
| Decide | Approve or hold each submission | Never submits without your click |
| Remember | Nothing | Records every expiry, payment window, condition and follow-up |
| Follow up | Nothing | Acts on department decisions, prepares newly unblocked approvals and reminds you |

---

## Before you start (one-time setup)

1. In the `pragati-industrial-orchestration` folder, check that `.env` contains `GEMINI_API_KEY=your-key`.
2. Run `npm install` (first time only), then `npm start`.
3. Open <http://localhost:4183>.

To start with a clean slate (for example before recording), open the profile menu (top right) and choose **Reset demo data**. **Reset agent** on the Agent Mode page clears only the agent's work (documents, drafts, deadlines, activity).

---

## Step 1: Open PRAGATI

You land on the PRAGATI home page, which works on top of India's National Single Window System. You are signed in as the applicant **Mukesh Sharma** (top right).

Under the hero section there's a gold banner:

> **NEW · AGENT MODE ON NSWS** — *From submitting to delegating.*

This is the only thing you need to click.

## Step 2: Switch on Agent Mode

Click **✦ Delegate my approvals →**. You can also use the **✦ Agent Mode** button in the header, or **Agent Mode · Delegate** at the top of the left sidebar.

The Agent Mode workspace opens. Check two things in the blue header panel:

- **Status pill:** it should read **Agent Mode on · gemini-…**, which means the agent is connected. If it says *Agent offline*, the server or API key isn't set up (see *Before you start*).
- **Demo clock:** it starts at **27 Sept 2026**. You'll move it forward later to simulate time passing.

The page has three columns:

| Left | Middle | Right |
|---|---|---|
| **1 · Hand over documents** | **2 · Live agent activity** | **3 · Deadlines I'm remembering** |
| **Needs your decision** | | **Applications prepared** |
| | | **Talk to your agent** |

## Step 3: Hand over your documents

Give the agent whatever you have: certificates, the land lease, the project report, letters from departments. You don't have to sort them or say what each one is for.

- **Your own files:** click **Drop documents here or click to browse**, or drag files anywhere onto the Agent Mode page (PDF, images or text, up to 8 MB each). Word files aren't read yet; save them as PDF first.
- **For the demo:** click **Load sample document pack (fictional)**. It loads six documents:

| Document | What's inside | What a careful reviewer should notice |
|---|---|---|
| `Certificate_of_Incorporation.txt` | CIN, PAN, directors, registered office | Establishes the legal entity |
| `PAN_and_GST_Registration.txt` | GSTIN 27AABCM4821K1Z5, place of business | Links the PAN to the factory address |
| `MIDC_Land_Lease_Plot18_Chakan.txt` | 2.4 ha plot, lease until 2036 | **Construction must start by 15 Nov 2026** |
| `Detailed_Project_Report.txt` | Capacity, ₹35 cr cost, 150 jobs, Red category, water, boiler, solvents | **Boiler Form II certificate not yet received** |
| `Fire_Safety_Plan_Rev2.txt` | Hydrants, foam system, detection | **Consultant signature and stamp missing** |
| `MIDC_Water_Provisional_Allotment.txt` | 25 KLD water quota reserved | **Deposit of ₹1,75,000 due by 20 Oct 2026, or the quota lapses** |

Each file appears in the list with a **New** badge.

*Optional:* in **Anything the agent should know?**, add context in plain words, for example: *"Construction must start in October. Prioritise MPCB consent."*

## Step 4: Delegate

Click **✦ Delegate 6 documents to the agent**.

That's the whole hand-off. The status pill changes to **Agent working**, and each document's badge changes to **With agent**, then **Read by agent**.

## Step 5: Watch the agent work

The **Live agent activity** feed shows each step as it happens. A spinner at the top shows the current action (*Reviewing your journey…*, *Reading a document…*, *Preparing an application…*) with a short line of the agent's reasoning.

A typical run goes like this:

1. **Reviewed your approval journey:** the agent loads your 17-approval map. It sees 5 approvals already done (land, building plan, labour, groundwater, electricity), MPCB Consent to Establish (CTE) in review, and several approvals ready to start.
2. **Read Certificate_of_Incorporation.txt → Verified**, and the same for the other documents.
3. **Read Fire_Safety_Plan_Rev2.txt → Needs attention:** *unsigned and unstamped by licensed fire consultant.*
4. **Updated your project profile:** investment, employment, pollution category and location, taken from the project report.
5. **Will remember:** MIDC water deposit (20 Oct 2026), construction start (15 Nov 2026), lease expiry (31 Mar 2036).
6. **Prepared** Factory Plan Approval, Industrial Water Connection, Fire NOC, PESO Site & Layout Approval and Boiler Registration.
7. **Asked for your approval:** Factory Plan Approval and Industrial Water Connection, the drafts with nothing missing.
8. **Notified you:** for example, *"Fire NOC is blocked by an unsigned fire safety plan."* These also appear under the bell icon in the header.

When it finishes, a short summary appears in **Talk to your agent**, for example:

> *I read your 6 documents and updated your project profile. Factory Plan and Water Connection applications are ready for your approval. Fire NOC and Boiler Registration need a signed fire plan and the boiler Form II. The water deposit is due on 20 October 2026. I'll keep watching your deadlines and approvals.*

A full delegation takes about 1–3 minutes. It can take longer when Gemini is busy, because the server retries and moves to another Gemini model automatically. The exact wording and order vary from run to run, because the agent reasons about your documents each time.

## Step 6: Review what the agent found

Nothing has been submitted yet. Look over the results:

- **Deadlines I'm remembering:** each deadline with a countdown badge (for example *23 days*), coloured red, amber or blue by urgency. When you've handled one (for example, paid the water deposit), click **Done**. The agent stops reminding you and is told on its next run.
- **Applications prepared:** every draft with its status: *Draft ready*, *Awaiting your approval*, or *Draft · 1 to fix*.
- **Review a draft:** click an application name to see every field the agent filled, the value, and **the document it came from**. Missing items appear in a red box under **To fix before submission**.
- **My Documents** (sidebar): the documents are now in your vault, marked *read by Agent*, with verification status, expiry and any issue.

## Step 7: Approve the submissions

**Needs your decision** holds one card per complete application. The agent never submits on its own. For each card you can:

- **Approve & submit (demo):** records the submission with a reference number (for example *MH-WTR-27011*) and sends a notification.
- **Review draft:** check the fields first.
- **Not now:** keep the draft without submitting. The agent won't ask again unless something changes.
- **Approve all:** approve every waiting card at once.

After you approve, the agent picks the job up again. It records a follow-up on each submission's service deadline and tells you what it's watching, for example *"Submitted. I'll follow up on 11 Oct."*

## Step 8: Fix what the agent flagged

Some drafts can't go ahead yet. With the sample pack, those are Fire NOC (unsigned fire plan), Boiler Registration (missing Form II) and PESO (missing certified drawings). To fix one:

1. Get the missing document, for example a signed and stamped fire safety plan.
2. Click **Upload fix** next to the draft in **Applications prepared**, or **Upload corrected document** inside the draft. You can also drop the file anywhere on the page. A corrected file with the same name as the old one (for example `Fire_Safety_Plan_Rev2.txt`) replaces it and shows as **New version**.
3. Click **Delegate** again. The agent is told this is a corrected version, re-checks it, and updates the vault and the draft. If nothing else is missing, the draft moves to **Needs your decision**.

You can also instruct the agent in plain language in **Talk to your agent**:

- *"Which approvals are blocked, and why?"*
- *"What do I have to do this week?"*
- *"Hold the PESO application until I talk to my consultant."*
- *"मेरे अगले तीन काम क्या हैं?"* (in Hindi: "What are my next three tasks?"). The agent replies in Hindi or Marathi when you write to it in that language.

## Step 9: Let time pass (demo clock)

In real life, departments take days or weeks to decide. In the demo, you compress that time with the buttons in the header panel:

- **Fast-forward 7 days**
- **Fast-forward 30 days**

When the clock moves:

- **Department decisions arrive (simulated).** A submitted application is approved once its processing time has passed. For example, Water Connection takes 8 days and Factory Plan takes 14. The MPCB CTE already under review is also decided. Each one appears as ★ *approved* in the feed, with a notification.
- **Reminders fire.** Every remembered deadline inside its reminder window sends a notification, such as *"Reminder: MIDC water deposit — due in 9 days"*.
- **The approval map updates.** Approvals whose prerequisites are now met move from *Blocked* to *Ready to Apply*.

## Step 10: The agent follows up on its own

Right after the clock moves, the agent runs an **automatic check-in** without you asking. It:

1. re-reads your journey and sees what changed;
2. prepares the newly unblocked approvals. After a 30-day jump, for example, MPCB CTE's approval unblocks **Consent to Operate (CTO)**, **Hazardous Waste Authorisation**, **Environmental Clearance Screening** and the **Joint Site Inspection**, and Factory Plan's approval unblocks the **Factory Licence**;
3. asks for your approval on any that are complete;
4. tells you what changed and what's due next.

This is where "keep you informed" happens: you didn't ask, and the agent moved the journey forward anyway.

## Step 11: See it from the department's side

Open the profile menu (top right), choose **Switch workspace → Government / Department View**, then open **My Queue** and click the **✦ Via Agent** tab.

Your agent-submitted applications appear in the officer's queue, marked **Submitted via Agent**, with their reference numbers and an SLA clock. Once simulated decisions arrive, they show as **Approved**. The officer workspace also has **Smart Queue** (prioritised by SLA risk and downstream impact), **Inspection Coordination** and **Public Transparency**.

Switch back with **Applicant View · Mukesh Chemicals**.

## Step 12: Keep going until you're ready to operate

Repeat the loop until every approval is done:

```text
hand over new documents → agent prepares → you approve → time passes → agent follows up
```

The journey ends at **Operational Readiness Review**, the final milestone. It becomes available once Fire NOC, Consent to Operate, Factory Licence and the Joint Site Inspection are all approved. You can check overall progress at any time in **Approval Roadmap** (the dependency graph) or **My Dashboard**.

---

## What stays with you, and what the agent handles

| You | The agent |
|---|---|
| Hand over documents once | Reads them, extracts the facts and reuses them in every application |
| Approve or hold each submission | Prepares every application that is ready, with a source for each field |
| Supply what's missing when asked | Tells you exactly what's missing and why it blocks progress |
| Answer questions if you want to | Tracks every deadline, reminds you in time and follows up on submissions |
| | Checks in when things change and prepares the next wave of approvals |

## Good to know

- **You stay in control.** The agent can't submit anything without your click, and it can't prepare an approval whose prerequisites aren't approved.
- **Check what it read.** Every prepared field lists its source document. Review the drafts before approving.
- **State lives in your browser.** Your progress stays after a page reload. The document files themselves are kept only for the current session. To start over, use **Reset demo data** in the profile menu.
- **When Gemini is busy,** the server retries and moves to another Gemini model by itself. If the agent stops with a *Gemini is under heavy demand* message, wait a minute and click **Delegate** again, or send a message.
- **Everything is illustrative.** The approval list, durations, SLAs and department decisions are demonstration data. A real journey must follow the responsible authority's official requirements.
