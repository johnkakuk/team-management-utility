import {
    Main
} from './team.js'

// Define master variables
const input  = document.querySelector('#cmdInput');
const output = document.querySelector('#output');
const screen = document.querySelector('#screen');
let inputState = false;

 // Base utils

// Print command to output and reset input
    const newline = () => {
        print(`<div class="line"><span class="prompt">${esc(state.prompt)}</span><span class="muted">${esc(input.value)}</span></div>`);
        input.value = '';
}

// Sanitizes special characters and replaces with HTML entities
const esc = (s) => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

const state = {
    prompt: 'user@team:~$',
    commands: {},
};

const print = (html) => { // Shorthand create/append
    const div = document.createElement('div');
    div.innerHTML = html; output.appendChild(div);
    scrollToBottom();
};

const now = () => new Date();

const stamp = () => now().toLocaleTimeString();

const scrollToBottom = () => {
    screen.scrollTop = screen.scrollHeight;
};

const banner = () => { // Print initial info @ top
    print(`<div class="soft">TEAM MANAGEMENT UTILITY <span class="muted">v1.0</span> — <span class="stamp">${stamp()}</span></div>`);
    print(`<div class="muted">Type <span class="kbd">help</span> to list commands.</div>`);
}

const register = (name, handler, desc) => { // Create new console function
    state.commands[name] = {handler, desc};
}

// Wire console.log into the terminal. AI Assisted. DISABLE ALL THIS FOR DEBUGGING
const native = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
};

console.log = (...args) => { native.log(...args); print(`<span class="ok">${esc(args.join(' '))}</span>`); };
console.info = (...args) => { native.info(...args); print(`<span class="info">${esc(args.join(' '))}</span>`); };
console.warn = (...args) => { native.warn(...args); print(`<span class="warn">${esc(args.join(' '))}</span>`); };
console.error = (...args) => { native.error(...args); print(`<span class="error">${esc(args.join(' '))}</span>`); };


// Core command functions

// Function to parse arguments (AI assisted)
const parseArgs = (str) => {
    const out = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(str))) out.push(m[1] ?? m[2] ?? m[3]);
    return out;
}

// Command execution (AI assisted)
const exec = (line) => {
    const argv = parseArgs(line.trim());
    const cmd = argv.shift();
    if (!cmd) return;
    const item = state.commands[cmd];
    if (!item) { console.error(`command not found: ${cmd}`); return; }
    try { item.handler(argv); } catch (err) { console.error(err.message || String(err)); }
}

// Key event handler
const handleKeydown = (e) => {
    if(e.key==='Enter'){
        e.preventDefault();

        // Get input state from team.js. Only run if false.
        inputState = Main.isBlocking();
        
        if(inputState) return;
        else {
            const line = input.value;
            newline();
            exec(line);   
        }
        return;
    }
}

// Focus on command input
const focus = () => {
    input.focus();
    updateCaret();
}

// Caret control (AI assisted)
const caret = document.querySelector('.caret');

const updateCaret = () => {
    // Caret
    const inputRect = input.getBoundingClientRect();

    // Positioning device
    const mirror = document.createElement('span');
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre';
    mirror.style.font = getComputedStyle(input).font;
    mirror.textContent = input.value.slice(0, input.selectionStart);
    document.body.appendChild(mirror);

    // Get width of content through hidden element to find X-axis value for caret
    const caretX = mirror.getBoundingClientRect().width;
    caret.style.position = 'absolute';
    caret.style.left = inputRect.left + caretX + 'px';
    caret.style.top = inputRect.top + 'px';

    // Remove positioning device once done
    document.body.removeChild(mirror);
}

/////////////////////////////////////////////
//                                         //
//    C O N S O L E   F U N C T I O N S    //
//                                         //
/////////////////////////////////////////////
// Support utilities
register('help', () => {
    const rows = Object.keys(state.commands)
        .sort()
        .map(k => `  ${k.padEnd(10)} - ${state.commands[k].desc || ''}`);
    console.log(rows.join('\n'));
}, 'List available commands');

register('clear', () => {
    output.innerHTML='';
    banner();
}, 'Clear the screen');

register('about', () => {
    console.log('Team management utility by John Kakuk.');
}, 'About this console');

// Main functions
register('add', (argv) => {
    if (argv.length > 0) {
        console.error(`This command does not support arguments: just use "add"`);
        return;
    }
    Main.addEmployee();
}, 'Add a new employee');

register('remove', (argv) => {
    if (argv.length > 1) {
        console.error(`Usage syntax: remove "Full Name"`);
        return;
    }
    Main.selectEmployee(argv[0], "remove");
}, 'Remove an employee');

register('edit', (argv) => {
    if (argv.length > 1) {
        console.error(`Usage syntax: edit "Full Name"`);
        return;
    }
    Main.selectEmployee(argv[0], "edit");
}, 'Edit an employee');

register('display', (argv) => {
    if (argv.length > 1) {
        console.error(`Usage syntax: display "Full Name"`);
        return;
    }
    Main.selectEmployee(argv[0], "display");
}, "Display an employee's details");

register('list', () => {
    Main.selectEmployee(null, "list");
}, "List all employees");

(() => {
    // Boot
    window.onload = () => {
        banner();
        focus();
    };

    // Main event listeners
    input.addEventListener('keydown', handleKeydown);
    screen.addEventListener('click', focus);

    input.addEventListener('input', updateCaret);
    input.addEventListener('click', updateCaret);
    input.addEventListener('keyup', updateCaret);
    window.addEventListener('resize', updateCaret);
})();

export {
    input,
    output,
    screen,
    newline
}