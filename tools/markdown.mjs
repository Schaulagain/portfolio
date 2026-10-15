// Small markdown renderer shared by the browser and build.mjs.
// Supports: headings, paragraphs, nested lists, hr, fenced code, blockquotes,
// inline code, links, bare URLs, bold and italic. Input is trusted (our own content/).

const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text) {
    // Pull code spans out first so nothing inside them gets formatted.
    const codes = [];
    text = text.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
    text = escapeHtml(text);

    const links = [];
    const stash = (html) => `\u0001${links.push(html) - 1}\u0001`;

    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
        const external = /^https?:/.test(href);
        return stash(`<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`);
    });
    text = text.replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (url) =>
        stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url.replace(/^https?:\/\//, '')}</a>`));

    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>');

    text = text.replace(/\u0001(\d+)\u0001/g, (_, i) => links[i]);
    return text.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(codes[i])}</code>`);
}

const indentOf = (line) => line.match(/^\s*/)[0].replace(/\t/g, '    ').length;
const LIST_ITEM = /^(\s*)([*+-]|\d+\.)\s+(.*)$/;

function parseList(lines, i) {
    const baseIndent = indentOf(lines[i]);
    const ordered = /^\s*\d+\./.test(lines[i]);
    const items = [];

    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) {
            // A blank line only continues the list if the next line is still part of it.
            const next = lines[i + 1];
            if (next !== undefined && LIST_ITEM.test(next) && indentOf(next) >= baseIndent) { i++; continue; }
            break;
        }
        const m = line.match(LIST_ITEM);
        const indent = indentOf(line);
        if (m && indent === baseIndent) {
            items.push({ text: m[3], children: '' });
            i++;
        } else if (m && indent > baseIndent && items.length) {
            const [html, next] = parseList(lines, i);
            items[items.length - 1].children += html;
            i = next;
        } else if (!m && indent > baseIndent && items.length) {
            items[items.length - 1].text += ' ' + line.trim();
            i++;
        } else {
            break;
        }
    }

    const tag = ordered ? 'ol' : 'ul';
    const body = items.map((it) => `<li>${inline(it.text)}${it.children}</li>`).join('');
    return [`<${tag}>${body}</${tag}>`, i];
}

export function renderMarkdown(md) {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let para = [];

    const flush = () => {
        if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
        para = [];
    };

    for (let i = 0; i < lines.length;) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) { flush(); i++; continue; }

        const fence = trimmed.match(/^```(\w*)/);
        if (fence) {
            flush();
            const code = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
            i++;
            const cls = fence[1] ? ` class="language-${fence[1]}"` : '';
            out.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`);
            continue;
        }

        const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            flush();
            const level = heading[1].length;
            out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
            i++;
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { flush(); out.push('<hr>'); i++; continue; }

        if (LIST_ITEM.test(line)) {
            flush();
            const [html, next] = parseList(lines, i);
            out.push(html);
            i = next;
            continue;
        }

        if (trimmed.startsWith('>')) {
            flush();
            const quote = [];
            while (i < lines.length && lines[i].trim().startsWith('>')) quote.push(lines[i++].trim().replace(/^>\s?/, ''));
            out.push(`<blockquote>${renderMarkdown(quote.join('\n'))}</blockquote>`);
            continue;
        }

        para.push(trimmed);
        i++;
    }
    flush();
    return out.join('\n');
}

// "key: value" lines → object (used for content/config.md).
export function parseConfig(text) {
    const config = {};
    for (const line of text.split('\n')) {
        const m = line.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
        if (m) config[m[1]] = m[2].trim();
    }
    return config;
}

// Hide email addresses from scrapers: mailto links become data attributes that site.js decodes.
export function obfuscateEmails(html) {
    const encode = (s) => Buffer.from([...s].reverse().join('')).toString('base64');
    return html.replace(/<a href="mailto:([^"]+)"[^>]*>[^<]*<\/a>/g, (_, addr) =>
        `<a class="mail" href="#contact" data-mail="${encode(addr)}">${addr.replace('@', ' [at] ').replace(/\./g, ' [dot] ')}</a>`);
}
