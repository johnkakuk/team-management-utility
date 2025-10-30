/*
 *  JOURNAL:
 *  - Add args to journal command
 *      - YYYY-MM-DD to open specific entry
 *      - -y to open yesterday
 *      - -t to open tomorrow
 *  - Create view command
 *      - Create an arrow-key-navigable list of latest 15 entries
 *  - Add args to view command
 *      - MM to view all entries from a given month (most recent year)
 *      - YYYY-MM to view all entries from a given month and year
 *  - Create search command (args required)
 *      - search "search content"
 *      - Allow users to search for entries containing the search parameter
 * 
/* ==== main.js — Shell Router & UI ================================================== */
import { startEditor } from './editor.js';

// === date helpers ===
function todayISO(tz = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function fmtBannerDateISO(iso, tz = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // noon UTC avoids DST edge cases
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  }).format(dt);
}

/* -----------------------------------------------------------------------------
 * DOM REFS & SHELL STATE
 * --------------------------------------------------------------------------- */
const input  = document.querySelector('#cmdInput');
const output = document.querySelector('#output');
const screen = document.querySelector('#screen');

// Renderer guard for DB
const db = window.db ?? {
  get: async () => null,
  upsert: async (date, content) => ({ id: -1, date, content })
};

// Whether a subprogram (team.js) is currently consuming input
let inputState = false;
let activeProgram = null; // holds an active subprogram (if any)

// Visible prompt and command registry
const state = {
  prompt: 'user@team:~$',
  commands: {},
};

// Minimal shell API for subprograms (e.g., editor.js)
const shell = {
  print,
  esc,
  setPrompt(p) { state.prompt = p; },
  resetPrompt() { state.prompt = 'user@team:~$'; },
  enter(program) { activeProgram = program; },
  exit() { activeProgram = null; this.resetPrompt(); }
};

/* -----------------------------------------------------------------------------
 * UTILITIES
 * --------------------------------------------------------------------------- */

// Escape HTML before injecting into the DOM
function esc(s){
    return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
} 

// Append rendered HTML to the output and keep view scrolled to the bottom
function print(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    output.appendChild(div);
    scrollToBottom();
};

const now   = () => new Date();
const stamp = () => now().toLocaleTimeString();

function scrollToBottom() {
  screen.scrollTop = screen.scrollHeight;
};

// Echo the current input line into the transcript and clear the input
function newline() {
  print(
    `<div class="line">
       <span class="prompt">${esc(state.prompt)}</span>
       <span class="muted">${esc(input.value)}</span>
     </div>`
  );
  input.value = '';
};

// Initial banner
function banner() {
  print(`<div class="soft">TEAM MANAGEMENT UTILITY <span class="muted">v1.0</span> — <span class="stamp">${stamp()}</span></div>`);
  print(`<div class="muted">Type <span class="kbd">help</span> to list commands.</div>`);
};

/* -----------------------------------------------------------------------------
 * CONSOLE BRIDGE (pipe console.* into terminal output)
 * --------------------------------------------------------------------------- */

// const native = {
//   log:   console.log,
//   info:  console.info,
//   warn:  console.warn,
//   error: console.error,
// };

// console.log   = (...args) => { native.log(...args);   print(`<span class="ok">${esc(args.join(' '))}</span>`);   };
// console.info  = (...args) => { native.info(...args);  print(`<span class="info">${esc(args.join(' '))}</span>`); };
// console.warn  = (...args) => { native.warn(...args);  print(`<span class="warn">${esc(args.join(' '))}</span>`); };
// console.error = (...args) => { native.error(...args); print(`<span class="error">${esc(args.join(' '))}</span>`); };

/* -----------------------------------------------------------------------------
 * COMMAND REGISTRY & EXECUTION
 * --------------------------------------------------------------------------- */

// Register a new command
function register(name, handler, desc) {
  state.commands[name] = { handler, desc };
};

// Tokenizer that respects quotes:   foo "bar baz"  -> ["foo","bar baz"]
function parseArgs(str) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(str))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
};

// Execute a single command line
const exec = async (line) => {
  const argv = parseArgs(line.trim());
  const cmd  = argv.shift();
  if (!cmd) return;

  const item = state.commands[cmd];
  if (!item) { console.error(`command not found: ${cmd}`); return; }

  try {
    await item.handler(argv);
  } catch (err) {
    const msg = err && err.stack ? err.stack : (err?.message || String(err));
    print(`<div class="error">${esc(msg)}</div>`);
    console.error(err);
  }
};

/* -----------------------------------------------------------------------------
 * KEY HANDLER & CARET
 * --------------------------------------------------------------------------- */

const handleKeydown = async (e) => {
  if (e.key !== 'Enter') return;

  e.preventDefault();

  const line = input.value;
  newline();

  // If a subprogram is active, let it consume the line
  if (activeProgram && typeof activeProgram.consume === 'function') {
    try {
      await activeProgram.consume(line);
    } catch (err) {
      const msg = err && err.stack ? err.stack : (err?.message || String(err));
      print(`<div class="error">${esc(msg)}</div>`);
      console.error(err);
    }
    return;
  }

  // Normal command execution
  await exec(line);
};

const focus = () => {
  input.focus();
  updateCaret();
};

// Fake caret that follows the real cursor inside the input
const caret = document.querySelector('.caret');

const updateCaret = () => {
  const inputRect = input.getBoundingClientRect();

  // Hidden mirror to measure caret X position
  const mirror = document.createElement('span');
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre';
  mirror.style.font = getComputedStyle(input).font;
  mirror.textContent = input.value.slice(0, input.selectionStart);
  document.body.appendChild(mirror);

  const caretX = mirror.getBoundingClientRect().width;
  caret.style.position = 'absolute';
  caret.style.left = (inputRect.left + caretX) + 'px';
  caret.style.top  = inputRect.top + 'px';

  document.body.removeChild(mirror);
};

let caretRAF = null;
const scheduleCaret = () => {
  if (caretRAF) cancelAnimationFrame(caretRAF);
  caretRAF = requestAnimationFrame(updateCaret);
};

/* -----------------------------------------------------------------------------
 * BUILT-IN COMMANDS
 * --------------------------------------------------------------------------- */

// Support utilities
register('help', () => {
  const rows = Object.keys(state.commands)
    .sort()
    .map(k => `  ${k.padEnd(10)} - ${state.commands[k].desc || ''}`);
  console.log(rows.join('\n'));
}, 'List available commands');

register('clear', () => {
  output.innerHTML = '';
  banner();
}, 'Clear the screen');

register('about', () => {
  console.log('Team management utility by John Kakuk.');
}, 'About this console');

// App starters
register('journal', async () => {
  const date = todayISO();
  let row = await db.get(date);
  if (!row) {
    row = await db.upsert(date, '');
  }
  // Pass payload to editor without breaking old signature (extra args are ignored if unused)
  startEditor(shell, {
    id: row.id ?? date,
    date: row.date ?? date,
    initialContent: row.content ?? ''
  });
}, "Create/open today's journal entry");

/* -----------------------------------------------------------------------------
 * BOOT
 * --------------------------------------------------------------------------- */

(() => {
  window.onload = () => {
    banner();
    focus();
  };

  input.addEventListener('keydown', handleKeydown);
  screen.addEventListener('click', focus);

  input.addEventListener('input', scheduleCaret);
  input.addEventListener('click', scheduleCaret);
  input.addEventListener('keyup', scheduleCaret);
  window.addEventListener('resize', scheduleCaret);
})();

/* -----------------------------------------------------------------------------
 * PUBLIC EXPORTS (consumed by team.js or tests)
 * --------------------------------------------------------------------------- */
export { input, output, screen, print, newline, shell };