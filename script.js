// Markdown parser (simple version)
function parseMarkdown(md) {
    // Headers
    md = md.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    md = md.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    md = md.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    // Lists
    md = md.replace(/^\* (.*$)/gm, '<li>$1</li>');
    md = md.replace(/^\- (.*$)/gm, '<li>$1</li>');
    md = md.replace(/<li>.*<\/li>/gms, function (match) {
        return '<ul>' + match + '</ul>';
    });

    // Links
    md = md.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Bold and italic
    md = md.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/\*(.*?)\*/g, '<em>$1</em>');
    md = md.replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>');
    md = md.replace(/\_(.*?)\_/g, '<em>$1</em>');

    // Code
    md = md.replace(/`(.*?)`/g, '<code>$1</code>');
    md = md.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Paragraphs
    md = md.replace(/^(?!<[a-z])(.*$)/gm, function (m) {
        return m.trim() ? '<p>' + m + '</p>' : '';
    });

    return '<div class="markdown-content">' + md + '</div>';
}

// Terminal application
class TerminalApp {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.commandInput = document.getElementById('command-input');
        this.commands = {};
        this.config = {};

        this.init();
    }

    async init() {
        // Load configuration first
        await this.loadConfig();

        // Set terminal title
        document.getElementById('terminal-title').textContent =
            `${this.config.username}@portfolio:~ — bash — 80x24`;

        // Load commands
        this.commands = {
            help: {
                description: "Show this help message",
                execute: () => this.showHelp()
            },
            about: {
                description: "About me",
                execute: async () => {
                    const content = await this.loadContent('about');
                    return parseMarkdown(content);
                }
            },
            skills: {
                description: "My technical skills",
                execute: async () => {
                    const content = await this.loadContent('skills');
                    return parseMarkdown(content);
                }
            },
            projects: {
                description: "My projects",
                execute: async () => {
                    const content = await this.loadContent('projects');
                    return parseMarkdown(content);
                }
            },
            hobbies: {
                description: "My hobbies and interests",
                execute: async () => {
                    const content = await this.loadContent('hobbies');
                    return parseMarkdown(content);
                }
            },
            contact: {
                description: "How to contact me",
                execute: async () => {
                    const content = await this.loadContent('contact');
                    return parseMarkdown(content);
                }
            },
            resume: {
                description: "Download my resume",
                execute: () => {
                    const link = document.createElement('a');
                    link.href = 'resume.pdf';
                    link.download = `${this.config.username}_Resume.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return 'Initiating resume download... <i class="fas fa-file-download"></i>';
                }
            },
            welcome: {
                description: "Show welcome message again",
                execute: () => this.showWelcome()
            },
            clear: {
                description: "Clear the terminal screen",
                execute: function () {
                    const terminal = document.getElementById('terminal');

                    // Clear ALL children (including input line)
                    while (terminal.firstChild) {
                        terminal.removeChild(terminal.firstChild);
                    }

                    // Create and append a fresh input line
                    const inputDiv = document.createElement('div');
                    inputDiv.className = 'terminal-input';
                    inputDiv.innerHTML = `
                        <span class="prompt">visitor@portfolio:~$</span>
                        <input type="text" class="command-input" id="command-input" autofocus>
                    `;
                    terminal.appendChild(inputDiv);

                    // Re-focus the input
                    document.getElementById('command-input').focus();

                    return ''; // No output needed
                }
            },
        };

        // Show welcome message
        await this.showWelcome();

        // Enable input
        this.commandInput.disabled = false;
        this.commandInput.focus();

        // Set up event listeners
        this.setupEventListeners();
    }

    async loadConfig() {
        try {
            const response = await fetch('./content/config.md');
            const text = await response.text();

            // Simple config parser
            const config = {};
            text.split('\n').forEach(line => {
                const [key, ...value] = line.split(':');
                if (key && value) {
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
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${page}:`, error);
            return `# Error\n\nCould not load ${page} content.`;
        }
    }

    async showWelcome() {
        const welcomeContent = await this.loadContent('about');
        const welcomeText = `
<pre class="ascii-art">
   _____ __  __    _    _   _    ____ ___ _   _ _____ ____  
  / ____|  \/  |  / \  | \ | |  / ___|_ _| \ | | ____|  _ \ 
 | (___ | |\/| | / _ \ |  \| | | |  _ | ||  \| |  _| | |_) |
  \___ \| |  | |/ ___ \| |\  | | |_| || || |\  | |___|  _ < 
  ____) |_|  |_/_/   \_\_| \_|  \____|___|_| \_|_____|_| \_\
</pre>
<p>${this.config.welcomeMessage || 'Welcome to my terminal portfolio!'}</p>
<p>Type <span class="command-example">help</span> to see available commands</p>
<div class="construction">
    <i class="fas fa-hard-hat"></i> Portfolio under active development <i class="fas fa-tools"></i>
</div>
        `;

        return welcomeText;
    }

    showHelp() {
        let helpText = '<h2>Available commands:</h2><ul>';
        for (const [cmd, details] of Object.entries(this.commands)) {
            helpText += `<li><span class="command">${cmd}</span> - ${details.description}</li>`;
        }
        helpText += '</ul>';
        return helpText;
    }

    setupEventListeners() {
        // Handle command input
        this.commandInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const commandText = this.commandInput.value.trim().toLowerCase();
                this.commandInput.value = '';

                // Create command line display
                const commandLine = document.createElement('div');
                commandLine.className = 'command-line';
                commandLine.innerHTML = `<span class="prompt">visitor@portfolio:~$</span> <span class="command">${commandText}</span>`;
                this.terminal.insertBefore(commandLine, document.querySelector('.terminal-input'));

                // Process command
                let output = '';
                if (this.commands[commandText]) {
                    output = await this.commands[commandText].execute();
                } else if (commandText) {
                    output = `<span class="error">Command not found: ${commandText}. Type 'help' for available commands.</span>`;
                }

                // Display output
                if (output) {
                    const outputDiv = document.createElement('div');
                    outputDiv.className = 'output';
                    outputDiv.innerHTML = output;
                    this.terminal.insertBefore(outputDiv, document.querySelector('.terminal-input'));
                }

                // Scroll to bottom
                this.terminal.scrollTop = this.terminal.scrollHeight;
            }
        });

        // Focus input on any click in terminal
        this.terminal.addEventListener('click', () => {
            this.commandInput.focus();
        });
    }
}

// Initialize the terminal app
new TerminalApp();