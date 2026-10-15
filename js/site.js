import { createMatrix } from './matrix.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const config = JSON.parse($('#site-config').textContent);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer: coarse)').matches;
const THEMES = ['matrix', 'amber', 'dracula', 'nord', 'paper'];

// Storage can throw (private mode, blocked cookies); every access goes through here.
const store = (kind) => ({
    get(key) { try { return window[kind].getItem(key); } catch { return null; } },
    set(key, value) { try { window[kind].setItem(key, value); } catch { /* ignore */ } },
});
const local = store('localStorage');
const session = store('sessionStorage');

// ---------- helpers ----------

function hydrateEmails() {
    for (const a of $$('a.mail[data-mail]')) {
        const address = [...atob(a.dataset.mail)].reverse().join('');
        a.href = `mailto:${address}`;
        if (!a.hasAttribute('data-keep-text')) a.textContent = address;
        a.removeAttribute('data-mail');
    }
}

const emailAddress = () => ($('a.mail[href^="mailto:"]')?.getAttribute('href') || '').replace('mailto:', '');

const cmdLink = (cmd, label = cmd) => `<button type="button" class="cmd-link" data-cmd="${esc(cmd)}">${esc(label)}</button>`;

function levenshtein(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return row[b.length];
}

function progressBar(label, done) {
    const el = document.createElement('div');
    el.className = 'progress';
    el.innerHTML = `<span class="progress-label">${esc(label)}</span><span class="progress-track"><span class="progress-fill"></span></span><span class="progress-pct">0%</span>`;
    const fill = $('.progress-fill', el);
    const pct = $('.progress-pct', el);
    el.play = async (ms = 600) => {
        const steps = reducedMotion ? 1 : 12;
        for (let i = 1; i <= steps; i++) {
            const value = Math.round((i / steps) * 100);
            fill.style.width = `${value}%`;
            pct.textContent = `${value}%`;
            if (steps > 1) await sleep(ms / steps);
        }
        if (done) pct.textContent = done;
    };
    return el;
}

// ---------- theme & matrix ----------

const matrix = createMatrix($('#matrix'), $('.hero'));

function applyTheme(name) {
    document.documentElement.dataset.theme = name;
    local.set('theme', name);
    matrix.refreshColors();
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    $('meta[name="theme-color"]')?.setAttribute('content', bg);
}

const currentTheme = () => document.documentElement.dataset.theme || THEMES[0];

// ---------- terminal ----------

class Terminal {
    constructor() {
        this.log = $('#log');
        this.body = $('#terminal-body');
        this.input = $('#cmd');
        this.form = $('#prompt-form');
        this.promptText = $('.prompt', this.form).textContent;
        this.history = JSON.parse(session.get('history') || '[]');
        this.historyIndex = this.history.length;
        this.busy = false;
        this.commands = createCommands(this);

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.busy) return;
            const value = this.input.value;
            this.input.value = '';
            this.run(value);
        });
        this.input.addEventListener('keydown', (e) => this.onKey(e));
        this.body.addEventListener('click', (e) => {
            if (e.target.closest('a, button') || getSelection().toString()) return;
            this.input.focus({ preventScroll: true });
        });
    }

    print(content, className = '') {
        const el = document.createElement('div');
        el.className = `output ${className}`.trim();
        if (content instanceof Node) el.append(content);
        else el.innerHTML = content;
        this.log.append(el);
        return el;
    }

    printCommand(text) {
        const line = document.createElement('div');
        line.className = 'line';
        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = this.promptText;
        const typed = document.createElement('span');
        typed.className = 'typed';
        typed.textContent = text;
        line.append(prompt, ' ', typed);
        this.log.append(line);
        return line;
    }

    scrollToEnd() { this.body.scrollTop = this.body.scrollHeight; }
    scrollToLine(el) { this.body.scrollTop = el.offsetTop - 12; }

    async run(raw) {
        const text = raw.trim();
        const line = this.printCommand(text);
        if (!text) { this.scrollToEnd(); return; }

        if (this.history.at(-1) !== text) {
            this.history = [...this.history, text].slice(-50);
            session.set('history', JSON.stringify(this.history));
        }
        this.historyIndex = this.history.length;

        const [name, ...args] = text.split(/\s+/);
        const command = this.commands[name.toLowerCase()];
        this.busy = true;
        try {
            if (command) {
                const out = await command.run(args, text);
                if (out != null && out !== '') this.print(out, command.className);
            } else {
                this.print(this.notFound(name), 'error');
            }
        } catch (err) {
            console.error(err);
            this.print(`${esc(name)}: something went wrong. Try ${cmdLink('help')}.`, 'error');
        } finally {
            this.busy = false;
        }

        if (command?.long && line.isConnected) this.scrollToLine(line);
        else this.scrollToEnd();
    }

    // Used by chips and clickable commands: type it out, then run it.
    async typeAndRun(cmd) {
        if (this.busy) return;
        this.busy = true;
        this.input.value = '';
        if (!reducedMotion) {
            for (const ch of cmd) {
                this.input.value += ch;
                await sleep(22);
            }
            await sleep(80);
        }
        this.busy = false;
        this.input.value = '';
        await this.run(cmd);
        if (!coarsePointer) this.input.focus({ preventScroll: true });
    }

    notFound(name) {
        const candidates = this.visibleNames()
            .map((c) => [c, levenshtein(name.toLowerCase(), c)])
            .filter(([, d]) => d <= 2)
            .sort((a, b) => a[1] - b[1]);
        const hint = candidates.length
            ? ` Did you mean ${cmdLink(candidates[0][0])}?`
            : ` Type ${cmdLink('help')} for a list of commands.`;
        return `zsh: command not found: ${esc(name)}.${hint}`;
    }

    visibleNames() {
        return Object.entries(this.commands).filter(([, c]) => !c.hidden).map(([n]) => n);
    }

    onKey(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (!this.history.length) return;
            e.preventDefault();
            const delta = e.key === 'ArrowUp' ? -1 : 1;
            this.historyIndex = Math.max(0, Math.min(this.history.length, this.historyIndex + delta));
            this.input.value = this.history[this.historyIndex] ?? '';
            requestAnimationFrame(() => this.input.setSelectionRange(this.input.value.length, this.input.value.length));
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.complete();
        } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            this.log.replaceChildren();
        } else if (e.ctrlKey && e.key.toLowerCase() === 'c' && !getSelection().toString()) {
            e.preventDefault();
            this.printCommand(`${this.input.value}^C`);
            this.input.value = '';
            this.scrollToEnd();
        } else if (e.key === 'Escape') {
            this.input.value = '';
        }
    }

    complete() {
        const value = this.input.value.replace(/^\s+/, '');
        const parts = value.split(/\s+/);
        let options;
        let prefix;
        if (parts.length === 1) {
            options = this.visibleNames();
            prefix = '';
        } else {
            const argOptions = this.commands[parts[0].toLowerCase()]?.complete;
            if (!argOptions) return;
            options = argOptions();
            prefix = parts.slice(0, -1).join(' ') + ' ';
        }
        const word = parts.at(-1).toLowerCase();
        const matches = options.filter((o) => o.startsWith(word));
        if (matches.length === 1) {
            this.input.value = prefix + matches[0] + ' ';
        } else if (matches.length > 1) {
            let common = matches[0];
            for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1);
            this.input.value = prefix + common;
            this.printCommand(value);
            this.print(matches.map((m) => cmdLink(prefix + m, m)).join(' '), 'columns');
            this.scrollToEnd();
        }
    }

    async boot() {
        this.busy = true;
        if (!reducedMotion && !session.get('booted')) {
            let skipped = false;
            const skip = () => { skipped = true; };
            window.addEventListener('keydown', skip, { once: true });
            window.addEventListener('pointerdown', skip, { once: true });

            const box = this.print('', 'boot');
            for (const line of bootLines()) {
                box.insertAdjacentHTML('beforeend', line);
                this.scrollToEnd();
                if (!skipped) await sleep(70 + Math.random() * 110);
            }
            if (!skipped) await sleep(400);
            window.removeEventListener('keydown', skip);
            window.removeEventListener('pointerdown', skip);
            box.remove();
            session.set('booted', '1');
        }
        this.print(welcome(), 'welcome');
        this.busy = false;
        if (!coarsePointer) this.input.focus({ preventScroll: true });
    }
}

// ---------- content ----------

function bootLines() {
    const ok = (s) => `<div><span class="ok">[  OK  ]</span> ${s}</div>`;
    const now = new Date();
    return [
        `<div class="muted">[    0.000000] sumanOS ${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')} booting on ${esc(location.hostname || 'localhost')}</div>`,
        ok(`Mounted <b>/home/${esc(config.username)}</b>`),
        ok('Started <b>php-fpm.service</b> — Laravel &amp; Symfony runtime'),
        ok('Started <b>mysql.service</b>'),
        ok('Started <b>coffee.service</b>'),
        ok(`Loaded <b>${config.pages.length}</b> content modules`),
        ok('Reached target <b>portfolio.target</b>'),
    ];
}

function welcome() {
    const art = $('#banner-art')?.content.textContent ?? '';
    return `<pre class="banner" aria-label="${esc(config.name)}">${esc(art)}</pre>
        <p>Hi, I'm <strong class="accent">${esc(config.name)}</strong> — ${esc(config.role)}. ${esc(config.welcomeMessage || '')}</p>
        <p class="muted">Type ${cmdLink('help')} or try ${cmdLink('about')}, ${cmdLink('projects')}, ${cmdLink('neofetch')}.
        <span class="desktop-only">Tab completes, ↑/↓ browse history.</span></p>`;
}

function pageNode(name) {
    const el = $(`#${name} .page-body`).cloneNode(true);
    for (const node of $$('[id]', el)) node.removeAttribute('id');
    return el;
}

function neofetch() {
    const logo = [
        '   ____   ',
        '  / ___|  ',
        '  \\___ \\  ',
        '   ___) | ',
        '  |____/  ',
        '          ',
        '   >_     ',
    ].join('\n');
    const rows = [
        ['Name', config.name],
        ['Role', config.role],
        ['Uptime', `${config.experience} of professional experience`],
        ['Stack', config.stack],
        ['Host', location.hostname || 'localhost'],
        ['Shell', 'zsh — portfolio edition'],
        ['Theme', currentTheme()],
        ['Resolution', `${window.innerWidth}x${window.innerHeight}`],
    ];
    const title = `visitor@${config.username}`;
    return `<div class="neofetch">
        <pre class="neofetch-logo" aria-hidden="true">${esc(logo)}</pre>
        <div>
            <div class="accent"><b>${esc(title)}</b></div>
            <div class="muted">${'-'.repeat(title.length)}</div>
            ${rows.map(([k, v]) => `<div><span class="accent">${k}</span>: ${esc(v)}</div>`).join('')}
            <div class="swatches" aria-hidden="true">${'<span></span>'.repeat(8)}</div>
        </div>
    </div>`;
}

function createCommands(term) {
    const files = () => [...config.pages.map((p) => `${p}.md`), 'resume.pdf'];
    const commands = {};

    for (const name of config.pages) {
        commands[name] = {
            desc: $(`#${name}`)?.dataset.desc || name,
            className: 'md',
            long: true,
            run: () => pageNode(name),
        };
    }

    Object.assign(commands, {
        resume: {
            desc: 'Download my resume (PDF)',
            async run() {
                const bar = progressBar('resume.pdf', 'done ✓');
                term.print(bar);
                await bar.play(700);
                const a = document.createElement('a');
                a.href = 'resume.pdf';
                a.download = `${config.name} - Resume.pdf`;
                a.click();
                return `Saved to your downloads. Prefer to read it here? <a href="resume.pdf" target="_blank" rel="noopener">Open in a new tab</a>.`;
            },
        },
        neofetch: { desc: 'System info, but it’s me', run: neofetch },
        social: {
            desc: 'Where to find me online',
            run: () => `<ul class="plain-list">
                <li><span class="accent">github</span>   <a href="${esc(config.github)}" target="_blank" rel="noopener noreferrer">${esc(config.github.replace(/^https?:\/\//, ''))}</a></li>
                <li><span class="accent">linkedin</span> <a href="${esc(config.linkedin)}" target="_blank" rel="noopener noreferrer">${esc(config.linkedin.replace(/^https?:\/\//, ''))}</a></li>
                <li><span class="accent">email</span>    <a href="mailto:${esc(emailAddress())}">${esc(emailAddress())}</a></li>
            </ul>`,
        },
        email: {
            desc: 'Copy my email address',
            async run() {
                const address = emailAddress();
                try {
                    await navigator.clipboard.writeText(address);
                    return `<span class="ok">✓</span> Copied <b>${esc(address)}</b> to your clipboard. Or <a href="mailto:${esc(address)}">open your mail app</a>.`;
                } catch {
                    return `Email me at <a href="mailto:${esc(address)}">${esc(address)}</a>.`;
                }
            },
        },
        ls: {
            desc: 'List files',
            run: () => files().map((f) => cmdLink(f.endsWith('.md') ? `cat ${f}` : 'resume', f)).join(' '),
            className: 'columns',
        },
        cat: {
            desc: 'Print a file, e.g. cat about.md',
            complete: files,
            className: 'md',
            long: true,
            run([file]) {
                if (!file) return `<span class="error">usage: cat &lt;file&gt;</span> — try ${cmdLink('ls')}`;
                const name = file.replace(/^(\.\/|~\/)/, '');
                if (name === 'resume.pdf') return `cat: resume.pdf: binary file. Try ${cmdLink('resume')} instead.`;
                const page = name.replace(/\.md$/, '');
                if (config.pages.includes(page)) return pageNode(page);
                return `<span class="error">cat: ${esc(file)}: No such file or directory</span>`;
            },
        },
        theme: {
            desc: `Change colours (${THEMES.join(', ')})`,
            complete: () => [...THEMES, 'next'],
            run([name]) {
                if (!name) {
                    return `Themes: ${THEMES.map((t) => cmdLink(`theme ${t}`, t + (t === currentTheme() ? ' ●' : ''))).join(' ')}`;
                }
                const next = name === 'next' ? THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length] : name.toLowerCase();
                if (!THEMES.includes(next)) return `<span class="error">theme: unknown theme '${esc(name)}'</span>. Available: ${THEMES.join(', ')}`;
                applyTheme(next);
                return `Theme set to <span class="accent">${next}</span>.`;
            },
        },
        matrix: {
            desc: 'Toggle the digital rain',
            run() {
                matrix.set(!matrix.enabled);
                local.set('matrix', matrix.enabled ? 'on' : 'off');
                return matrix.enabled ? 'Wake up, Neo… 🐇' : 'Rain stopped. Back to reality.';
            },
        },
        history: {
            desc: 'Show command history',
            run: () => term.history.map((h, i) => `<div><span class="muted">${String(i + 1).padStart(4)}</span>  ${esc(h)}</div>`).join(''),
        },
        clear: { desc: 'Clear the screen (Ctrl+L)', run() { term.log.replaceChildren(); } },
        gui: {
            desc: 'Jump to the classic, non-terminal view',
            run() {
                $('#plain').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
                return 'Switching to the classic view ↓';
            },
        },
        help: {
            desc: 'Show this list',
            run: () => {
                const rows = term.visibleNames()
                    .map((n) => `<div class="help-row">${cmdLink(n)}<span>${esc(commands[n].desc)}</span></div>`)
                    .join('');
                return `<div class="help">${rows}</div>
                    <p class="muted">Shortcuts: <kbd>Tab</kbd> complete · <kbd>↑</kbd><kbd>↓</kbd> history · <kbd>Ctrl</kbd>+<kbd>L</kbd> clear. There are a few hidden commands too.</p>`;
            },
        },

        // Hidden extras
        whoami: { hidden: true, run: () => `visitor — hopefully a future colleague 👋<br>This machine belongs to <b>${esc(config.name)}</b>. Run ${cmdLink('about')} to learn more.` },
        pwd: { hidden: true, run: () => '/home/visitor' },
        date: { hidden: true, run: () => esc(new Date().toString()) },
        echo: { hidden: true, run: (_, raw) => esc(raw.replace(/^echo\s*/i, '')) },
        banner: { hidden: true, className: 'welcome', run: welcome },
        exit: { hidden: true, run: () => commands.gui.run() },
        cd: { hidden: true, run: ([dir]) => (dir && config.pages.includes(dir.replace(/\/$/, '')) ? pageNode(dir.replace(/\/$/, '')) : 'You are already home. 🏠'), className: 'md' },
        sudo: {
            hidden: true,
            async run(args) {
                term.print('[sudo] password for visitor: ');
                await sleep(reducedMotion ? 0 : 900);
                if (args.join(' ').toLowerCase().includes('hire')) return commands.hire.run();
                return '<span class="error">visitor is not in the sudoers file. This incident will be reported.</span> 🚨';
            },
        },
        rm: { hidden: true, run: () => `rm: cannot remove: read-only file system. Nice try though 😏 — my inbox is writable: ${cmdLink('email')}` },
        vim: { hidden: true, run: () => 'Entering vim… just kidding. Nobody has ever left. Try <kbd>:q</kbd> — or ' + cmdLink('help') },
        coffee: { hidden: true, run: () => '<pre>   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   `----\'</pre>Error 418: I\'m a teapot. ☕' },
        ping: { hidden: true, run: () => `PONG — I usually reply within a day. ${cmdLink('email')}` },
        hello: { hidden: true, run: () => `Hey there! 👋 Glad you stopped by. Try ${cmdLink('about')}.` },
        hire: {
            hidden: true,
            async run() {
                term.print('Initiating recruitment protocol…');
                for (const label of ['backend', 'frontend', 'linux', 'teamwork']) {
                    const bar = progressBar(label, '100% ✓');
                    term.print(bar);
                    term.scrollToEnd();
                    await bar.play(450);
                }
                return `<span class="ok">✓ Match found.</span> Great choice — let's talk: ${cmdLink('email')} · ${cmdLink('social')} · ${cmdLink('resume')}`;
            },
        },
    });

    commands.hi = commands.hello;
    commands.nano = commands.emacs = commands.vim;
    commands.hireme = commands.hire;
    return commands;
}

// ---------- start ----------

hydrateEmails();
applyTheme(currentTheme());
matrix.set(local.get('matrix') ? local.get('matrix') === 'on' : !reducedMotion);

const terminal = new Terminal();

document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-cmd]');
    if (!trigger) return;
    e.preventDefault();
    terminal.typeAndRun(trigger.dataset.cmd);
});

terminal.boot();
