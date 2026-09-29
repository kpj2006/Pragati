// PRAGATI Agent Mode — "From submitting to delegating."
// The applicant hands over documents; Gemini (via /api/agent) reads them and works the
// journey through the tools below, which act on this browser's prototype state.
// Submissions always wait for the applicant's approval and never leave the prototype.

let ctx;
let server = { checked: false, reachable: false, configured: false, model: '', accessCodeRequired: false };
let schemas = {};
const docStore = new Map();   // file name -> {kind, mediaType, data}; bytes stay in memory only
let convo = [];               // Agent message history for this browser session
let running = false;
let live = { thinking: '', tool: '', text: '' };
let decisions = [];           // applicant decisions queued for the agent's next turn

const SAMPLE_DOCS = ['Certificate_of_Incorporation.txt', 'PAN_and_GST_Registration.txt', 'MIDC_Land_Lease_Plot18_Chakan.txt', 'Detailed_Project_Report.txt', 'Fire_Safety_Plan_Rev2.txt', 'MIDC_Water_Provisional_Allotment.txt'];
const MAX_FILE = 8 * 1024 * 1024;
const MAX_TURNS = 30;
const DAY = 86400000;
const TOOL_LABELS = { get_journey_state: 'Reviewing your journey', record_document: 'Reading a document', update_project_profile: 'Updating your project profile', prepare_application: 'Preparing an application', request_submission_approval: 'Requesting your approval', remember_deadline: 'Remembering a deadline', notify_user: 'Notifying you' };

const S = () => ctx.getState();
const A = () => S().agent;
const esc = s => ctx.esc(s);
const abtn = (label, cls, attrs) => `<button type="button" class="${cls}" ${attrs}>${label}</button>`;
const approvalById = id => ctx.approvals.find(a => a.id === id);
const now = () => new Date(ctx.today.getTime() + A().dayOffset * DAY);
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const fmt = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const parseIso = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(new Date(s + 'T12:00:00')) ? new Date(s + 'T12:00:00') : null;
const daysUntil = s => Math.round((parseIso(s) - now()) / DAY);

function blankAgent() {
  return { dayOffset: 0, docs: [], activity: [], chat: [], drafts: {}, pending: [], submitted: {}, deadlines: [], accessCode: '' };
}

export function initAgent(context) {
  ctx = context;
  const s = S();
  s.agent = { ...blankAgent(), ...(s.agent || {}) };
  // Document bytes are not persisted; keep only files the agent has already read.
  s.agent.docs = s.agent.docs.filter(d => d.read || d.sent);
  syncGovRows();
  bindAgentEvents();
  checkServer();
}

export function resetAgent() {
  S().agent = blankAgent();
  convo = []; decisions = []; docStore.clear();
  for (let i = ctx.govRows.length - 1; i >= 0; i--) if (ctx.govRows[i].viaAgent) ctx.govRows.splice(i, 1);
}

// Submissions the applicant approved appear in the officer's queue, closing the loop for the demo.
function syncGovRows() {
  const s = S();
  for (const [id, sub] of Object.entries(s.agent.submitted)) {
    const a = approvalById(id);
    if (!a || ctx.govRows.some(r => r.id === sub.reference)) continue;
    const elapsed = Math.max(0, s.agent.dayOffset - sub.day);
    ctx.govRows.unshift({ id: sub.reference, applicant: s.profile.company, person: s.profile.person, business: s.profile.sector === 'Chemicals' ? 'Chemical Manufacturing' : s.profile.sector, approval: a.name, dept: a.dept.split(' · ')[0], received: fmt(new Date(ctx.today.getTime() + sub.day * DAY)), days: elapsed, sla: a.sla, risk: 'LOW', status: s.approved.includes(id) ? 'Approved' : 'Submitted via Agent', progress: s.approved.includes(id) ? 100 : 10, viaAgent: true });
  }
}

async function checkServer() {
  try {
    const res = await fetch('/api/agent', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const info = await res.json();
    server = { checked: true, reachable: true, configured: info.configured, model: info.model, accessCodeRequired: info.accessCodeRequired };
    schemas = Object.fromEntries((info.tools || []).map(t => [t.name, t.input_schema]));
  } catch {
    server = { checked: true, reachable: false, configured: false, model: '', accessCodeRequired: false };
  }
  if (S().route === 'agent') refresh();
}

// ---------- rendering ----------

function refresh() {
  if (S().route !== 'agent') { ctx.render(); return; }
  const keep = ['agent-instructions', 'agent-chat-input', 'agent-access'].map(id => [id, document.getElementById(id)?.value]);
  const focused = document.activeElement?.id;
  const feed = document.getElementById('agent-feed');
  const scrolled = feed ? feed.scrollTop : 0;
  ctx.render();
  keep.forEach(([id, v]) => { const el = document.getElementById(id); if (el && v != null) el.value = v; });
  if (focused) document.getElementById(focused)?.focus();
  const newFeed = document.getElementById('agent-feed');
  if (newFeed) newFeed.scrollTop = scrolled;
  const log = document.getElementById('agent-chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}

function statusPill() {
  if (!server.checked) return `<span class="agent-pill">Checking agent…</span>`;
  if (!server.reachable) return `<span class="agent-pill off">Agent server offline · run <code>npm start</code></span>`;
  if (!server.configured) return `<span class="agent-pill off">Agent offline · API key not configured</span>`;
  if (running) return `<span class="agent-pill busy"><i></i>Agent working</span>`;
  return `<span class="agent-pill on"><i></i>Agent Mode on · ${esc(server.model)}</span>`;
}

function approvalState(id) {
  const a = A();
  if (S().approved.includes(id)) return ['Approved', 'green'];
  if (a.submitted[id]) return [`Submitted · ${a.submitted[id].reference}`, 'blue'];
  if (a.pending.some(p => p.approval_id === id)) return ['Awaiting your approval', 'amber'];
  const d = a.drafts[id];
  return d.missing_items.length ? [`Draft · ${d.missing_items.length} to fix`, 'red'] : ['Draft ready', 'green'];
}

function activityItem(x) {
  return `<div class="agent-event ${x.tone || ''}${Date.now() - (x.ts || 0) < 1200 ? ' fresh' : ''}"><span class="agent-ico">${x.icon}</span><div><strong>${esc(x.title)}</strong>${x.detail ? `<p>${esc(x.detail)}</p>` : ''}<small>${esc(x.time)}</small></div></div>`;
}

export function agentPage(el) {
  const s = S(), a = A();
  const newDocs = a.docs.filter(d => !d.sent);
  const drafts = Object.values(a.drafts);
  const deadlines = [...a.deadlines].sort((x, y) => x.due_date.localeCompare(y.due_date));
  const canRun = server.configured && !running;
  const liveLine = running ? `<div class="agent-live" id="agent-live">${liveHtml()}</div>` : '';

  el.innerHTML = ctx.pageStart('agent') + `
<section class="agent-hero">
  <div>
    <div class="eyebrow">AGENT MODE ON NSWS</div>
    <h1>From submitting to delegating.</h1>
    <p>Give PRAGATI the documents. Let the agent handle the journey, remember every deadline, and keep you informed.</p>
    <div class="agent-flow"><span>① Hand over documents</span><b>›</b><span>② Agent works the journey</span><b>›</b><span>③ You approve · it remembers</span></div>
  </div>
  <div class="agent-hero-side">
    ${statusPill()}
    <div class="agent-clock"><small>DEMO CLOCK</small><strong>${fmt(now())}</strong><span>${a.dayOffset ? `+${a.dayOffset} days` : 'Reference date'}</span></div>
    <div class="agent-ff">${abtn('Fast-forward 7 days', 'btn small light', 'data-agent="ff" data-days="7"')}${abtn('Fast-forward 30 days', 'btn small gold', 'data-agent="ff" data-days="30"')}</div>
    <small class="agent-ff-note">Simulates department decisions and lets the agent run its check-in.</small>
  </div>
</section>
${server.accessCodeRequired ? `<div class="noticebar section"><label class="field">Agent access code<input id="agent-access" type="password" value="${esc(a.accessCode)}" placeholder="Provided by the demo host" data-agent-input="access"></label></div>` : ''}
<div class="grid four section">
  <article class="card metric"><div class="label">Documents read</div><strong>${a.docs.filter(d => d.read).length}</strong><small>Handed over to the agent</small></article>
  <article class="card metric"><div class="label">Applications prepared</div><strong>${drafts.length}</strong><small>${Object.keys(a.submitted).length} submitted with your approval</small></article>
  <article class="card metric highlight"><div class="label">Needs your decision</div><strong>${a.pending.length}</strong><small>The agent never submits alone</small></article>
  <article class="card metric"><div class="label">Deadlines remembered</div><strong>${a.deadlines.length}</strong><small>${deadlines.filter(d => !d.done && daysUntil(d.due_date) >= 0 && daysUntil(d.due_date) <= 30).length} due within 30 days</small></article>
</div>
<div class="agent-grid section">
  <div class="agent-col">
    <section class="card">
      <div class="card-head"><h2>1 · Hand over documents</h2>${a.docs.length ? `<button class="linkbtn" data-agent="reset">Reset agent</button>` : ''}</div>
      <div class="card-pad">
        <div class="agent-drop" id="agent-drop" role="button" tabindex="0" data-agent="browse">
          <strong>Drop documents here or click to browse</strong>
          <small>PDF, images or text · certificates, leases, project reports, letters · a corrected file with the same name replaces the old one</small>
        </div>
        <button class="btn small section" data-agent="samples" ${running ? 'disabled' : ''}>Load sample document pack (fictional)</button>
        <div class="agent-docs">${a.docs.map(d => `<div class="docrow"><div><strong>${esc(d.name)}</strong><small>${esc(d.kind.toUpperCase())} · ${Math.max(1, Math.round(d.size / 1024))} KB</small></div>${d.read ? ctx.badge('Read by agent', 'green') : d.sent ? ctx.badge('With agent', 'blue') : `<span class="agent-doc-actions">${ctx.badge(d.updated ? 'New version' : 'New', 'amber')}<button class="linkbtn" data-agent="remove-doc" data-name="${esc(d.name)}">Remove</button></span>`}</div>`).join('') || '<div class="empty">No documents handed over yet.</div>'}</div>
        <label class="field section">Anything the agent should know? (optional)<textarea id="agent-instructions" rows="2" placeholder="e.g. Construction must start in October. Prioritise MPCB consent."></textarea></label>
        <button class="btn primary agent-delegate section" data-agent="delegate" ${canRun && newDocs.length ? '' : 'disabled'}>✦ Delegate ${newDocs.length ? `${newDocs.length} document${newDocs.length > 1 ? 's' : ''} ` : ''}to the agent</button>
      </div>
    </section>
    <section class="card section">
      <div class="card-head"><h2>Needs your decision</h2>${a.pending.length > 1 ? `<button class="btn small primary" data-agent="approve-all">Approve all</button>` : ''}</div>
      <div class="card-pad">${a.pending.map(p => `<div class="agent-decision"><strong>${esc(approvalById(p.approval_id)?.name || p.approval_id)}</strong><p>${esc(p.summary)}</p><div>${abtn('Approve &amp; submit (demo)', 'btn small primary', `data-agent="approve" data-id="${esc(p.id)}"`)}${abtn('Review draft', 'btn small', `data-agent="draft" data-approval="${esc(p.approval_id)}"`)}${abtn('Not now', 'btn small subtle', `data-agent="decline" data-id="${esc(p.id)}"`)}</div></div>`).join('') || '<div class="empty">Nothing is waiting on you.</div>'}</div>
    </section>
  </div>
  <div class="agent-col">
    <section class="card agent-feed-card">
      <div class="card-head"><h2>2 · Live agent activity</h2><span class="critical-tag">${running ? 'WORKING' : a.activity.length ? 'IDLE' : 'READY'}</span></div>
      ${liveLine}
      <div class="agent-feed" id="agent-feed">${a.activity.map(activityItem).join('') || `<div class="empty">Hand over documents and press <strong>Delegate</strong>. Every step the agent takes appears here.</div>`}</div>
    </section>
  </div>
  <div class="agent-col">
    <section class="card">
      <div class="card-head"><h2>3 · Deadlines I'm remembering</h2></div>
      <div class="card-pad">${deadlines.map(d => { const n = daysUntil(d.due_date); const tone = n < 0 ? 'red' : n <= 14 ? 'red' : n <= 45 ? 'amber' : 'blue'; return `<div class="docrow${d.done ? ' agent-done' : ''}"><div><strong>${esc(d.title)}</strong><small>${esc(fmt(parseIso(d.due_date)))} · ${esc(d.action)}</small></div><span class="agent-doc-actions">${d.done ? ctx.badge('✓ Done', 'green') : `${ctx.badge(n < 0 ? `${-n}d overdue` : n === 0 ? 'Due today' : `${n} days`, tone)}${abtn('Done', 'btn small subtle', `data-agent="deadline-done" data-id="${esc(d.id)}"`)}`}</span></div>`; }).join('') || '<div class="empty">The agent will list expiries, payment windows and follow-ups here.</div>'}</div>
    </section>
    <section class="card section">
      <div class="card-head"><h2>Applications prepared</h2></div>
      <div class="card-pad">${drafts.map(d => { const [label, tone] = approvalState(d.approval_id); return `<div class="docrow"><div><button class="linkbtn" data-agent="draft" data-approval="${esc(d.approval_id)}"><strong>${esc(d.name)}</strong></button><small>${esc(d.dept)} · ${d.fields.length} fields prefilled</small></div><span class="agent-doc-actions">${ctx.badge(esc(label), tone)}${d.missing_items.length && !A().submitted[d.approval_id] ? abtn('Upload fix', 'btn small', 'data-agent="browse"') : ''}</span></div>`; }).join('') || '<div class="empty">No applications prepared yet.</div>'}</div>
    </section>
    <section class="card section">
      <div class="card-head"><h2>Talk to your agent</h2></div>
      <div class="agent-chat-log" id="agent-chat-log">${a.chat.map(m => `<div class="chat-bubble ${m.role === 'user' ? 'user' : ''}">${esc(m.text).replace(/\n/g, '<br>')}</div>`).join('') || '<div class="chat-bubble">Ask me anything about your journey, or give me an instruction, for example “Which approvals are blocked, and why?”</div>'}</div>
      <form class="chat-input" id="agent-chat-form"><input id="agent-chat-input" maxlength="600" placeholder="${canRun ? 'Instruct or ask the agent' : 'Agent unavailable'}" ${canRun ? '' : 'disabled'}><button class="btn primary small" ${canRun ? '' : 'disabled'}>Send</button></form>
    </section>
  </div>
</div>
<div class="noticebar section">Documents handed over here are sent to Google Gemini through PRAGATI's server so the agent can read them; they are not sent to any government department. The approval catalogue, SLAs and department decisions are illustrative. “Submit” records a demo submission only. Check agent-read values before relying on them.</div>`;
}

function liveHtml() {
  const tool = live.tool ? `<span class="agent-live-tool">${esc(TOOL_LABELS[live.tool] || live.tool)}…</span>` : '<span class="agent-live-tool">Thinking…</span>';
  const thought = (live.text || live.thinking).trim().slice(-260);
  return `<span class="agent-spinner"></span>${tool}${thought ? `<p>${esc(thought)}</p>` : ''}`;
}

function updateLive() {
  const el = document.getElementById('agent-live');
  if (el) el.innerHTML = liveHtml();
}

// ---------- events ----------

function bindAgentEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-agent]');
    if (!el || el.disabled) return;
    const act = el.dataset.agent;
    if (act === 'browse') { if (el.closest('#portal-modal')) { S().modal = null; document.getElementById('portal-modal').innerHTML = ''; } openPicker(); }
    else if (act === 'samples') loadSamples();
    else if (act === 'delegate') delegate();
    else if (act === 'remove-doc') { A().docs = A().docs.filter(d => d.name !== el.dataset.name); docStore.delete(el.dataset.name); ctx.persist(); refresh(); }
    else if (act === 'approve') approve(el.dataset.id);
    else if (act === 'approve-all') { [...A().pending].forEach(p => approve(p.id, true)); kick(); }
    else if (act === 'decline') decline(el.dataset.id);
    else if (act === 'draft') showDraft(el.dataset.approval);
    else if (act === 'ff') fastForward(Number(el.dataset.days));
    else if (act === 'deadline-done') markDeadlineDone(el.dataset.id);
    else if (act === 'reset') { if (!running) { resetAgent(); ctx.persist(); refresh(); ctx.toast('Agent workspace cleared.'); } }
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'agent-drop') { e.preventDefault(); openPicker(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'agent-access') { A().accessCode = e.target.value.trim(); ctx.persist(); }
  });
  // On the Agent Mode page a file dropped anywhere is handed over, so a drop can never
  // miss while the page redraws, and the browser never navigates to the file.
  const onAgentPage = () => S().route === 'agent';
  const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
  document.addEventListener('dragover', e => {
    if (!onAgentPage() || !hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    document.getElementById('agent-drop')?.classList.add('over');
  });
  document.addEventListener('dragleave', e => { if (!e.relatedTarget) document.getElementById('agent-drop')?.classList.remove('over'); });
  document.addEventListener('drop', e => {
    if (!onAgentPage() || !hasFiles(e)) return;
    e.preventDefault();
    document.getElementById('agent-drop')?.classList.remove('over');
    addFiles(e.dataTransfer.files);
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'agent-chat-form') return;
    e.preventDefault();
    const input = document.getElementById('agent-chat-input');
    const text = input.value.trim();
    if (!text || running || !server.configured) return;
    input.value = '';
    A().chat.push({ role: 'user', text });
    run([{ type: 'text', text }]);
  });
}

function openPicker() {
  let input = document.getElementById('agent-file-picker');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'agent-file-picker';
    input.multiple = true;
    input.accept = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,application/pdf,image/*,text/plain';
    input.hidden = true;
    input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
    document.body.appendChild(input);
  }
  input.click();
}

function kindOf(file) {
  const t = file.type || '', n = file.name.toLowerCase();
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('text/') || /\.(txt|md)$/.test(n)) return 'text';
  return null;
}

function readFile(file, kind) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(kind === 'text' ? r.result : String(r.result).split(',')[1]);
    r.onerror = () => reject(r.error);
    kind === 'text' ? r.readAsText(file) : r.readAsDataURL(file);
  });
}

async function addFiles(list) {
  for (const file of [...(list || [])]) {
    const kind = kindOf(file);
    if (!kind) { ctx.toast(`${file.name}: Word files can't be read yet. Save it as PDF, an image or text and try again.`); continue; }
    if (file.size > MAX_FILE) { ctx.toast(`${file.name} is larger than 8 MB.`); continue; }
    const data = await readFile(file, kind);
    docStore.set(file.name, { kind, mediaType: kind === 'text' ? 'text/plain' : file.type || 'application/octet-stream', data });
    const existing = A().docs.find(d => d.name === file.name);
    if (existing) {
      Object.assign(existing, { kind, size: file.size, sent: false, read: false, updated: true });
      ctx.toast(`${file.name} replaced with the new version. Press Delegate.`);
    } else {
      A().docs.push({ name: file.name, kind, size: file.size, sent: false, read: false });
      ctx.toast(`${file.name} added. Press Delegate.`);
    }
  }
  ctx.persist(); refresh();
}

async function loadSamples() {
  const files = await Promise.all(SAMPLE_DOCS.map(async name => {
    const res = await fetch(`./assets/sample-docs/${name}`);
    return new File([await res.text()], name, { type: 'text/plain' });
  }));
  await addFiles(files);
  ctx.toast('Sample document pack loaded. Press Delegate.');
}

// ---------- agent loop ----------

function log(icon, title, detail = '', tone = '') {
  A().activity.unshift({ icon, title, detail, tone, ts: Date.now(), time: `${fmt(now())} · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` });
  A().activity = A().activity.slice(0, 120);
}

function delegate() {
  const newDocs = A().docs.filter(d => !d.sent && docStore.has(d.name));
  if (!newDocs.length || running) return;
  const note = document.getElementById('agent-instructions')?.value.trim();
  const content = [];
  for (const d of newDocs) {
    const f = docStore.get(d.name);
    content.push({ type: 'text', text: d.updated ? `File: ${d.name} (corrected version replacing the earlier copy; re-check it and update any draft that was waiting for it)` : `File: ${d.name}` });
    d.updated = false;
    if (f.kind === 'text') content.push({ type: 'document', source: { type: 'text', media_type: 'text/plain', data: f.data }, title: d.name });
    else if (f.kind === 'pdf') content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data }, title: d.name });
    else content.push({ type: 'image', source: { type: 'base64', media_type: f.mediaType, data: f.data } });
    d.sent = true;
  }
  const ask = `I am handing over ${newDocs.length} document${newDocs.length > 1 ? 's' : ''}. Handle my approval journey: read everything, prepare whatever can be prepared, ask me before any submission, remember every deadline and keep me informed.${note ? `\n\nMy note: ${note}` : ''}`;
  content.push({ type: 'text', text: ask });
  A().chat.push({ role: 'user', text: `Handed over ${newDocs.length} document${newDocs.length > 1 ? 's' : ''}.${note ? ` ${note}` : ''}` });
  const box = document.getElementById('agent-instructions');
  if (box) box.value = '';
  log('⇪', `Handed over ${newDocs.length} document${newDocs.length > 1 ? 's' : ''}`, newDocs.map(d => d.name).join(' · '));
  run(content);
}

function pushUser(blocks) {
  const last = convo.at(-1);
  if (last?.role === 'user') last.content = [...last.content, ...blocks];
  else convo.push({ role: 'user', content: blocks });
}

async function run(blocks) {
  if (!server.configured) { ctx.toast('Agent is offline: configure GEMINI_API_KEY on the server.'); return; }
  // Decisions queued without a run of their own (e.g. a deadline marked done) ride along.
  if (decisions.length && !blocks.some(b => b.text?.startsWith('[Applicant decisions]'))) {
    blocks = [{ type: 'text', text: `[Applicant decisions]\n${decisions.join('\n')}` }, ...blocks];
    decisions = [];
  }
  pushUser(blocks);
  running = true;
  live = { thinking: '', tool: '', text: '' };
  ctx.persist(); refresh();
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      live = { thinking: '', tool: '', text: '' }; updateLive();
      const msg = await callTurn();
      convo.push({ role: 'assistant', content: msg.content });
      const thought = msg.content.filter(b => b.type === 'thinking' && b.thinking).map(b => b.thinking).join(' ').trim();
      if (thought) log('◌', 'Agent reasoning', thought.length > 320 ? thought.slice(0, 317) + '…' : thought, 'muted');
      const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      const uses = msg.content.filter(b => b.type === 'tool_use');
      if (msg.stop_reason === 'refusal') { log('!', 'The agent declined this request', msg.stop_details?.explanation || '', 'red'); break; }
      if (msg.stop_reason === 'max_tokens' && uses.length) { log('!', 'Agent output was cut off', 'Try again with fewer documents at once.', 'red'); convo.pop(); break; }
      if (msg.stop_reason !== 'tool_use' || !uses.length) {
        if (text) { A().chat.push({ role: 'assistant', text }); log('✦', 'Agent update', text); }
        break;
      }
      if (text) log('✦', 'Agent note', text);
      const results = uses.map(executeTool);
      pushUser(results);
      ctx.persist(); refresh();
    }
  } catch (error) {
    log('!', 'Agent stopped', error.message, 'red');
    ctx.toast(error.message);
  }
  running = false;
  live = { thinking: '', tool: '', text: '' };
  A().chat = A().chat.slice(-40);
  ctx.persist(); refresh();
  if (decisions.length) kick();
}

async function callTurn() {
  const headers = { 'Content-Type': 'application/json' };
  if (A().accessCode) headers['x-agent-access'] = A().accessCode;
  const res = await fetch('/api/agent', { method: 'POST', headers, body: JSON.stringify({ messages: convo }) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Agent server returned ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', message = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line) continue;
      const ev = JSON.parse(line);
      if (ev.type === 'message') message = ev.message;
      else if (ev.type === 'error') throw new Error(ev.message);
      else if (ev.type === 'thinking') { live.thinking += ev.text; updateLive(); }
      else if (ev.type === 'text') { live.text += ev.text; updateLive(); }
      else if (ev.type === 'restart') { live = { thinking: '', tool: '', text: '' }; updateLive(); }
      else if (ev.type === 'tool_start') { live.tool = ev.name; live.thinking = ''; live.text = ''; updateLive(); }
    }
  }
  if (!message) throw new Error('The agent stream ended before the turn completed.');
  return message;
}

// Minimal JSON-schema check against the server's tool schemas. With eager input
// streaming the API does not validate tool inputs, so the client must.
function validate(schema, value, path = 'input') {
  if (!schema) return [];
  const errors = [];
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${path} must be an object`];
    for (const k of schema.required || []) if (!(k in value)) errors.push(`${path}.${k} is required`);
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties?.[k];
      if (!sub) { if (schema.additionalProperties === false) errors.push(`${path}.${k} is not a known field`); continue; }
      errors.push(...validate(sub, v, `${path}.${k}`));
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) return [`${path} must be an array`];
    value.forEach((v, i) => errors.push(...validate(schema.items, v, `${path}[${i}]`)));
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') errors.push(`${path} must be a string`);
    else if (schema.enum && !schema.enum.includes(value)) errors.push(`${path} must be one of: ${schema.enum.join(', ')}`);
  } else if (schema.type === 'integer') {
    if (!Number.isInteger(value)) errors.push(`${path} must be an integer`);
  } else if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') errors.push(`${path} must be a boolean`);
  }
  return errors;
}

class ToolError extends Error {}

function executeTool(use) {
  const handler = tools[use.name];
  try {
    if (!handler) throw new ToolError(`Unknown tool ${use.name}`);
    const errors = validate(schemas[use.name], use.input);
    if (errors.length) throw new ToolError(`Invalid input: ${errors.join('; ')}`);
    const result = handler(use.input);
    return { type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(result) };
  } catch (error) {
    // Rule checks (e.g. "blocked until CTE is approved") are the agent being corrected, not
    // failures: show them muted. Unknown tools or malformed inputs are retried silently.
    if (!(error instanceof ToolError)) { console.error(error); log('!', `${TOOL_LABELS[use.name] || use.name} failed`, error.message, 'red'); }
    else if (handler && !error.message.startsWith('Invalid input')) log('·', `Checked: ${TOOL_LABELS[use.name] || use.name}`, error.message, 'muted');
    return { type: 'tool_result', tool_use_id: use.id, content: error.message, is_error: true };
  }
}

function statusFor(a) {
  const sub = A().submitted[a.id];
  if (sub && !S().approved.includes(a.id)) return 'Submitted — in department review';
  return ctx.derivedStatus(a);
}

const tools = {
  get_journey_state() {
    const s = S(), a = A();
    const summary = ctx.approvals.reduce((m, x) => (m[statusFor(x)] = (m[statusFor(x)] || 0) + 1, m), {});
    log('⌕', 'Reviewed your approval journey', Object.entries(summary).map(([k, v]) => `${v} ${k}`).join(' · '));
    return {
      current_date: iso(now()),
      applicant_profile: s.profile,
      approvals: ctx.approvals.map(x => ({
        id: x.id, name: x.name, department: x.dept, stage: x.stage, status: statusFor(x),
        prerequisites: x.deps, required_documents: x.docs, illustrative_processing_days: x.days, illustrative_sla_days: x.sla,
        ...(a.drafts[x.id] ? { draft: { prepared_on: a.drafts[x.id].prepared_on, missing_items: a.drafts[x.id].missing_items } } : {}),
        ...(a.submitted[x.id] ? { submission: a.submitted[x.id] } : {}),
      })),
      document_vault: s.documents.map(d => ({ title: d.name, type: d.type, status: d.status, expiry: d.expiry, issue: d.issue || '' })),
      documents_handed_to_agent: a.docs.map(d => d.name),
      awaiting_applicant_decision: a.pending.map(p => ({ approval_id: p.approval_id, requested_on: p.requested_on })),
      remembered_deadlines: a.deadlines.map(d => ({ title: d.title, due_date: d.due_date, kind: d.kind, related_to: d.related_to || '', ...(d.done ? { status: 'done by applicant', done_on: d.done_on } : { days_left: daysUntil(d.due_date) }) })),
      note: 'Approval catalogue, prerequisites and durations are illustrative prototype data.',
    };
  },

  record_document(input) {
    const s = S();
    const doc = A().docs.find(d => d.name === input.file_name);
    if (doc) doc.read = true;
    const expiry = parseIso(input.expiry_date);
    const entry = {
      id: 'agent-' + input.file_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: input.title, type: `${input.document_type} · read by Agent`, uploaded: fmt(now()),
      status: input.status, expiry: expiry ? fmt(expiry) : 'No expiry', uses: 0,
      verified: input.status === 'Verified', issue: input.issues.join(' '), fields: input.extracted_fields, issuer: input.issuer || '',
    };
    const i = s.documents.findIndex(d => d.id === entry.id);
    i >= 0 ? s.documents.splice(i, 1, entry) : s.documents.unshift(entry);
    log('▧', `Read ${input.file_name}`, `${input.title} — ${input.status}${input.issues.length ? ': ' + input.issues.join('; ') : ''}`, input.issues.length ? 'amber' : 'green');
    return { ok: true, vault_id: entry.id };
  },

  update_project_profile(input) {
    const s = S();
    const { evidence, ...fields } = input;
    Object.assign(s.profile, fields);
    s.kyaDone = true;
    log('◇', 'Updated your project profile', `${Object.keys(fields).join(', ')} · from ${evidence}`);
    return { ok: true, profile: s.profile };
  },

  prepare_application(input) {
    const a = approvalById(input.approval_id);
    const status = statusFor(a);
    if (status === 'Approved') throw new ToolError(`${a.name} is already approved.`);
    if (A().submitted[a.id]) throw new ToolError(`${a.name} was already submitted (${A().submitted[a.id].reference}).`);
    if (status === 'Blocked') {
      const waiting = a.deps.filter(d => !S().approved.includes(d)).map(d => approvalById(d).name);
      throw new ToolError(`${a.name} is blocked until these are approved: ${waiting.join(', ')}.`);
    }
    const draft = { ...input, name: a.name, dept: a.dept, prepared_on: iso(now()), reference: `PRG-DRAFT-${a.id.toUpperCase()}` };
    A().drafts[a.id] = draft;
    if (input.missing_items.length) A().pending = A().pending.filter(p => p.approval_id !== a.id);
    S().events.unshift({ title: `Agent prepared ${a.name}`, detail: input.missing_items.length ? `${input.missing_items.length} item(s) to fix` : 'Ready for applicant approval', time: `${fmt(now())}, agent` });
    log('✎', `Prepared ${a.name}`, `${input.fields.length} fields prefilled · ${input.attached_documents.length} attached${input.missing_items.length ? ' · missing: ' + input.missing_items.join('; ') : ' · complete'}`, input.missing_items.length ? 'amber' : 'green');
    return { ok: true, draft_reference: draft.reference, missing_items: input.missing_items.length };
  },

  request_submission_approval(input) {
    const a = approvalById(input.approval_id);
    const draft = A().drafts[a.id];
    if (!draft) throw new ToolError(`Prepare ${a.name} before requesting approval.`);
    if (draft.missing_items.length) throw new ToolError(`${a.name} still has missing items: ${draft.missing_items.join('; ')}.`);
    if (A().submitted[a.id]) throw new ToolError(`${a.name} was already submitted.`);
    if (!A().pending.some(p => p.approval_id === a.id)) {
      A().pending.push({ id: `p-${a.id}-${Date.now()}`, approval_id: a.id, summary: input.summary, requested_on: iso(now()) });
    }
    log('✋', `Asked for your approval · ${a.name}`, input.summary, 'amber');
    return { status: 'awaiting_applicant_decision' };
  },

  remember_deadline(input) {
    const due = parseIso(input.due_date);
    if (!due) throw new ToolError('due_date must be a valid YYYY-MM-DD date.');
    const list = A().deadlines;
    const dup = list.find(d => d.due_date === input.due_date && (d.related_to || '') === (input.related_to || '') && d.kind === input.kind);
    if (dup) return { ok: true, already_remembered: dup.title, days_left: daysUntil(dup.due_date) };
    list.push({ id: `d-${Date.now()}-${list.length}`, ...input, created_on: iso(now()), reminded: false });
    const n = daysUntil(input.due_date);
    log('◷', `Will remember: ${input.title}`, `Due ${fmt(due)} (${n} days) · reminder ${input.remind_days_before} days before`, n <= 30 ? 'amber' : '');
    return { ok: true, days_left: n, reminder_on: iso(new Date(due.getTime() - input.remind_days_before * DAY)) };
  },

  notify_user(input) {
    const route = ctx.titles[input.route] ? input.route : 'agent';
    ctx.notify(input.message, route, input.severity);
    log('♢', 'Notified you', input.message, input.severity === 'info' ? '' : 'amber');
    return { ok: true };
  },
};

// ---------- applicant decisions & demo clock ----------

function approve(pid, batch = false) {
  const p = A().pending.find(x => x.id === pid);
  if (!p) return;
  const a = approvalById(p.approval_id);
  A().pending = A().pending.filter(x => x.id !== pid);
  const code = { cte: 'CTE', factory: 'FPA', water: 'WTR', fire: 'FIRE', peso: 'PESO', cto: 'CTO', licence: 'FACT', boiler: 'BLR', hazard: 'HWA', environment: 'EC', inspection: 'JSI', electricity: 'HT', groundwater: 'GW' }[a.id] || a.id.toUpperCase();
  const reference = `MH-${code}-${27000 + Object.keys(A().submitted).length * 7 + 11}`;
  A().submitted[a.id] = { reference, submitted_on: iso(now()), day: A().dayOffset };
  syncGovRows();
  ctx.notify(`Submitted with your approval (demo): ${a.name} · ${reference}`, 'agent', 'info');
  log('✓', `You approved · ${a.name} submitted (demo)`, `Reference ${reference} · now visible in the department queue`, 'green');
  decisions.push(`Applicant approved submission of ${a.name} (${a.id}). Demo reference ${reference}, submitted ${iso(now())}. Illustrative SLA ${a.sla} days.`);
  if (!batch) kick();
}

function decline(pid) {
  const p = A().pending.find(x => x.id === pid);
  if (!p) return;
  A().pending = A().pending.filter(x => x.id !== pid);
  log('⏸', `You held ${approvalById(p.approval_id).name}`, 'The draft stays prepared; the agent will not submit it.');
  decisions.push(`Applicant chose not to submit ${approvalById(p.approval_id).name} (${p.approval_id}) for now. Do not ask again unless something changes.`);
  ctx.persist(); refresh();
}

function kick() {
  ctx.persist(); refresh();
  if (running || !decisions.length || !server.configured) return;
  const text = `[Applicant decisions]\n${decisions.join('\n')}\nRecord follow-up deadlines for anything submitted and tell me anything I should know.`;
  decisions = [];
  run([{ type: 'text', text }]);
}

function markDeadlineDone(id) {
  const d = A().deadlines.find(x => x.id === id);
  if (!d || d.done) return;
  d.done = true;
  d.done_on = iso(now());
  log('✓', `You completed: ${d.title}`, d.action, 'green');
  decisions.push(`Applicant marked this deadline as done on ${d.done_on}: ${d.title} (${d.due_date}). Stop reminding about it.`);
  ctx.persist(); refresh();
  ctx.toast(`Marked done: ${d.title}`);
}

function fastForward(days) {
  if (running) { ctx.toast('Wait for the agent to finish its current work.'); return; }
  const s = S(), a = A();
  a.dayOffset += days;
  const updates = [], reminders = [];
  for (const x of ctx.approvals) {
    if (s.approved.includes(x.id)) continue;
    const sub = a.submitted[x.id];
    const seededReview = !sub && x.status === 'In Review' && ctx.derivedStatus(x) === 'In Review';
    if ((sub && a.dayOffset - sub.day >= x.days) || seededReview) {
      s.approved.push(x.id);
      const row = ctx.govRows.find(r => r.id === sub?.reference);
      if (row) Object.assign(row, { status: 'Approved', progress: 100 });
      updates.push(`${x.name} approved by ${x.dept} (simulated)${sub ? ` · ${sub.reference}` : ''}`);
      ctx.notify(`${x.name} approved (simulated department decision)`, 'roadmap', 'info');
      log('★', `${x.name} approved`, `${x.dept} · simulated department decision`, 'green');
    }
  }
  for (const d of a.deadlines) {
    const n = daysUntil(d.due_date);
    if (!d.done && !d.reminded && n <= d.remind_days_before) {
      d.reminded = true;
      reminders.push(`${d.title} — due ${d.due_date} (${n < 0 ? `${-n} days overdue` : `${n} days left`}): ${d.action}`);
      ctx.notify(`Reminder: ${d.title} — ${n < 0 ? 'overdue' : `due in ${n} days`}`, 'agent', n <= 7 ? 'risk' : 'warning');
    }
  }
  log('⏩', `Demo clock moved ${days} days`, `Today is ${fmt(now())}${updates.length ? ` · ${updates.length} department update(s)` : ''}${reminders.length ? ` · ${reminders.length} reminder(s)` : ''}`);
  ctx.persist(); refresh();
  if (server.configured && convo.length + a.activity.length > 0) {
    run([{ type: 'text', text: `[Automatic check-in] The demo clock moved forward ${days} days. Today is ${iso(now())}.\nDepartment updates:\n${updates.map(u => '- ' + u).join('\n') || '- none'}\nReminders that fired:\n${reminders.map(r => '- ' + r).join('\n') || '- none'}\nRe-read the journey state. For every approval that is now Ready to Apply and has no draft yet, call prepare_application using the documents already in the vault (list any missing documents in missing_items), then request approval for complete drafts. Remember any new deadlines, then tell me what changed.` }]);
  }
}

function showDraft(id) {
  const d = A().drafts[id];
  if (!d) return;
  const [label, tone] = approvalState(id);
  ctx.showModal(esc(d.name), `<p>${ctx.badge(esc(label), tone)} <small>${esc(d.dept)} · prepared ${esc(fmt(parseIso(d.prepared_on)))}</small></p>
    ${d.notes ? `<p>${esc(d.notes)}</p>` : ''}
    <div class="tablewrap"><table><thead><tr><th>FIELD</th><th>VALUE</th><th>SOURCE</th></tr></thead><tbody>${d.fields.map(f => `<tr><td>${esc(f.label)}</td><td><strong>${esc(f.value)}</strong></td><td><small>${esc(f.source_document)}</small></td></tr>`).join('')}</tbody></table></div>
    <p class="section"><strong>Attached:</strong> ${esc(d.attached_documents.join(', ') || 'None')}</p>
    ${d.missing_items.length ? `<div class="noticebar red"><strong>To fix before submission:</strong><br>${d.missing_items.map(esc).join('<br>')}<p class="section">Upload the corrected document, then press <strong>Delegate</strong>. The agent re-checks it and updates this draft.</p></div>` : '<div class="noticebar">Complete. The agent will ask before anything is submitted.</div>'}`,
  (d.missing_items.length ? abtn('Upload corrected document', 'btn primary', 'data-agent="browse"') : '') + ctx.btn('Close', 'modal-close', 'btn'));
}
