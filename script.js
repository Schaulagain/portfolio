function parseMarkdown(md) {
    // Headers
    md = md.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    md = md.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    md = md.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    // Links
    md = md.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Bold and italic
    md = md.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // --- FIXED LISTS ---
    // Convert all list items to <li>, then wrap consecutive <li>'s in a <ul>
    md = md.replace(/^[\*\-]\s(.*)/gm, '<li>$1</li>');
    md = md.replace(/<\/li>\s*<li>/g, '</li><li>'); // Handle adjacent items
    md = md.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');

    // Code
    md = md.replace(/`(.*?)`/g, '<code>$1</code>');
    md = md.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Paragraphs - wrap lines that aren't already in a block-level tag
    md = md.split('\n').map(line => {
        line = line.trim();
        if (!line) return '';
        if (/^<[h1-3|ul|li|p|pre]/.test(line)) {
            return line;
        }
        return `<p>${line}</p>`;
    }).join('');


    return `<div class="markdown-content">${md}</div>`;
}


// Terminal application
class TerminalApp {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.commandInput = document.getElementById('command-input');
        this.initialOutput = document.querySelector('.terminal-output');
        this.promptElement = document.querySelector('.terminal-input .prompt');
        this.commands = {};
        this.config = {};

        this.init();
    }

    async init() {
        // Load configuration first
        await this.loadConfig();

        // Set terminal title and prompt from config
        document.getElementById('terminal-title').textContent = `${this.config.username}@portfolio:~ — bash`;
        this.promptElement.textContent = `${this.config.username || 'visitor'}@portfolio:~$`;


        // Load commands
        this.commands = {
            help: {
                description: "Show this help message",
                execute: () => this.showHelp()
            },
            about: {
                description: "About me",
                execute: async () => this.renderMarkdown('about')
            },
            skills: {
                description: "My technical skills",
                execute: async () => this.renderMarkdown('skills')
            },
            projects: {
                description: "My projects",
                execute: async () => this.renderMarkdown('projects')
            },
            hobbies: {
                description: "My hobbies and interests",
                execute: async () => this.renderMarkdown('hobbies')
            },
            contact: {
                description: "How to contact me",
                execute: async () => this.renderMarkdown('contact')
            },
            resume: {
                description: "Download my resume",
                execute: () => this.downloadResume()
            },
            welcome: {
                description: "Show the welcome message again",
                execute: () => this.showWelcome()
            },
            clear: {
                description: "Clear the terminal screen",
                execute: () => this.clearTerminal()
            },
        };

        // Replace loading screen with welcome message
        this.initialOutput.innerHTML = this.showWelcome();
        this.terminal.scrollTop = this.terminal.scrollHeight;


        // Enable input
        this.commandInput.disabled = false;
        this.commandInput.placeholder = "type `help` and press Enter";
        this.commandInput.focus();

        // Set up event listeners
        this.setupEventListeners();
    }

    async loadConfig() {
        try {
            const response = await fetch('./content/config.md');
            if (!response.ok) throw new Error('Config file not found');
            const text = await response.text();

            const config = {};
            text.split('\n').forEach(line => {
                const [key, ...value] = line.split(':');
                if (key && value.length) {
                    config[key.trim()] = value.join(':').trim();
                }
            });

            this.config = config;
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = {
                username: 'suman',
                welcomeMessage: 'Welcome to my terminal portfolio!'
            };
        }
    }

    async loadContent(page) {
        try {
            const response = await fetch(`./content/${page}.md`);
            if (!response.ok) throw new Error(`Content for '${page}' not found.`);
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${page}:`, error);
            return `# Error\n\nCould not load content for **${page}**.`;
        }
    }

    async renderMarkdown(page) {
        const content = await this.loadContent(page);
        return parseMarkdown(content);
    }

    showWelcome() {
        return `
            <div class="output">
                <pre class="ascii-art glow">
                </pre>
                <p>${this.config.welcomeMessage || 'Welcome!'}</p>
                <p>Type <span class="command-example">help</span> to see available commands.</p>
                <div class="construction">
                    <i class="fas fa-code-branch"></i> SYSTEM STATUS: ACTIVE DEVELOPMENT <i class="fas fa-bug"></i>
                </div>
            </div>`;
    }

    showHelp() {
        let helpText = '<h2>Available commands:</h2><ul>';
        for (const [cmd, details] of Object.entries(this.commands)) {
            helpText += `<li><span class="command-example">${cmd}</span> - ${details.description}</li>`;
        }
        helpText += '</ul>';
        return helpText;
    }

    downloadResume() {
        const link = document.createElement('a');
        link.href = 'resume.pdf';
        link.download = `${this.config.username}_Resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return 'Initiating resume download... <i class="fas fa-file-download"></i>';
    }

    clearTerminal() {
        // Remove all previous command and output divs
        const outputs = this.terminal.querySelectorAll('.output, .command-line');
        outputs.forEach(el => el.remove());
        return ''; // Return empty string as no new output is needed
    }

    setupEventListeners() {
        this.commandInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const commandText = this.commandInput.value.trim().toLowerCase();
                const inputContainer = this.commandInput.parentElement;

                // Don't do anything if the command is empty
                if (!commandText) return;

                // Display the entered command
                const commandLine = document.createElement('div');
                commandLine.className = 'command-line';
                commandLine.innerHTML = `<span class="prompt glow">${this.promptElement.textContent}</span> <span class="command">${commandText}</span>`;
                this.terminal.insertBefore(commandLine, inputContainer);

                // Reset input
                this.commandInput.value = '';

                // Process command and display output
                let output = '';
                if (this.commands[commandText]) {
                    output = await this.commands[commandText].execute();
                } else {
                    output = `<span class="error">Command not found: ${commandText}.</span>`;
                }

                if (output) {
                    const outputDiv = document.createElement('div');
                    outputDiv.className = 'output';
                    outputDiv.innerHTML = output;
                    this.terminal.insertBefore(outputDiv, inputContainer);
                }

                // Scroll to bottom
                this.terminal.scrollTop = this.terminal.scrollHeight;
            }
        });

        // Focus input on any click in the terminal body
        this.terminal.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                this.commandInput.focus();
            }
        });
    }
}

// Initialize the terminal app
document.addEventListener('DOMContentLoaded', () => {
    new TerminalApp();
});