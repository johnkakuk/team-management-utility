(() => {
    // Define master variables
    const output = document.getElementById('output');
    const input  = document.getElementById('cmdInput');
    const screen = document.getElementById('screen');

    const state = {
        prompt: 'user@team:~$',
        commands: {},
    };

    // Base utils
    const now = () => new Date();

    const stamp = () => now().toLocaleTimeString();

    const scrollToBottom = () => {
        screen.scrollTop = screen.scrollHeight;
    };

    const print = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html; output.appendChild(div);
        scrollToBottom();
    };
    
    // Sanitizes special characters and replaces with HTML entities
    const esc = (s) => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

    // Wire console.log into the terminal. Had to build with AI
    const native = {
        log: console.log,
        warn: console.warn,
        error: console.error
    };
    console.log = (...args) => { native.log(...args); print(`<span class="ok">${esc(args.join(' '))}</span>`); };
    console.warn = (...args) => { native.warn(...args); print(`<span class="warn">${esc(args.join(' '))}</span>`); };
    console.error = (...args) => { native.error(...args); print(`<span class="error">${esc(args.join(' '))}</span>`); };

    // Print initial info @ top
    function banner() {
        print(`<div class="soft">TEAM MANAGEMENT UTILITY <span class="muted">v1.0</span> — <span class="stamp">${stamp()}</span></div>`);
        print(`<div class="muted">Type <span class="kbd">help</span> to list commands.</div>`);
    }

    // Print command and reset input
    function newline() {
        print(`<div class="line"><span class="prompt">${esc(state.prompt)}</span><span class="muted">${esc(input.value)}</span></div>`);
        input.value = '';
    }

    // Create new function
    function register(name, handler, desc) {
        state.commands[name] = {handler, desc};
    }

    /////////////////////////////////////////////
    //                                         //
    //    C O N S O L E   F U N C T I O N S    //
    //                                         //
    /////////////////////////////////////////////
    register('help', (argv) => {
        const rows = Object.keys(state.commands)
            .sort()
            .map(k => `  ${k.padEnd(10)} - ${state.commands[k].desc || ''}`);
        console.log(rows.join('\n'));
    }, 'List available commands');

    register('clear', () => { output.innerHTML=''; }, 'Clear the screen');

    register('about', () => {
        console.log('Team management utility by John Kakuk.');
    }, 'About this console');



    // Command execution
    function exec(line){
        const argv = line.trim().split(/\s+/);
        const cmd = argv[0];
        if(!cmd) return;
        const item = state.commands[cmd];
        if(!item){ console.error(`command not found: ${cmd}`); return; }
        try{ item.handler(argv); } catch(err){ console.error(err.message || String(err)); }
    }

    // Key event handler
    function handleKeydown(e) {
        if(e.key==='Enter'){
            e.preventDefault();
            const line = input.value;
            newline();
            exec(line);
            return;
        }
    }

    // Focus on command input
    function focus() {
        input.focus();
        updateCaret();
    }

    // Boot
    window.onload = () => {
        banner();
        focus();
    };

    // Main event listeners
    input.addEventListener('keydown', handleKeydown);
    screen.addEventListener('click', focus);

    // Caret control
    const caret = document.querySelector('.caret');

    function updateCaret() {
        const inputRect = input.getBoundingClientRect();
        const mirror = document.createElement('span');
        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.whiteSpace = 'pre';
        mirror.style.font = getComputedStyle(input).font;
        mirror.textContent = input.value.slice(0, input.selectionStart);
        document.body.appendChild(mirror);
        const caretX = mirror.getBoundingClientRect().width;
        caret.style.position = 'absolute';
        caret.style.left = inputRect.left + caretX + 'px';
        caret.style.top = inputRect.top + 'px';
        document.body.removeChild(mirror);
    }

    input.addEventListener('input', updateCaret);
    input.addEventListener('click', updateCaret);
    input.addEventListener('keyup', updateCaret);
    window.addEventListener('resize', updateCaret);
})();