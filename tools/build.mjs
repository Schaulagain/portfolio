// Builds the static site into dist/: renders content/*.md into index.html so the
// content is real HTML (crawlers, link previews, no-JS visitors), then copies assets.
//
//   node tools/build.mjs           build once
//   node tools/build.mjs --serve   build, serve on http://localhost:8000 and rebuild on change

import fs from 'node:fs/promises';
import { watch } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, parseConfig, obfuscateEmails } from './markdown.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

// Order here = order on the page and in the terminal's `help`.
const PAGES = [
    ['about', 'Who I am'],
    ['experience', 'Where I have worked'],
    ['projects', 'Things I have built'],
    ['skills', 'Languages, frameworks & tools'],
    ['hobbies', 'Life outside the editor'],
    ['contact', 'Get in touch'],
];

const ASSETS = ['style.css', 'favicon.svg', 'resume.pdf', 'robots.txt', 'content/preview.png', 'js'];

const escapeHtml = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const encodeEmail = (s) => Buffer.from([...s].reverse().join('')).toString('base64');

// Pages sit under the site's <h1>, so shift markdown headings down one level.
const demoteHeadings = (html) => html.replace(/<(\/?)h([1-5])\b/g, (_, slash, n) => `<${slash}h${+n + 1}`);

// {{key}} inserts an escaped value, {{{key}}} inserts raw HTML.
function fill(template, vars, file) {
    return template.replace(/\{\{(\{?)(\w+)\}?\}\}/g, (_, raw, key) => {
        if (!(key in vars)) throw new Error(`${file}: unknown placeholder {{${key}}}`);
        return raw ? vars[key] : escapeHtml(vars[key]);
    });
}

async function build() {
    const started = Date.now();
    const read = (p) => fs.readFile(path.join(root, p), 'utf8');
    const config = parseConfig(await read('content/config.md'));

    const sections = await Promise.all(PAGES.map(async ([name, desc], i) => {
        const html = obfuscateEmails(demoteHeadings(renderMarkdown(await read(`content/${name}.md`))));
        return `<section class="page" id="${name}" data-page="${name}" data-desc="${escapeHtml(desc)}">
    <p class="kicker"><span>${String(i + 1).padStart(2, '0')}</span> ~/${name}.md</p>
    <div class="page-body md" data-page="${name}">
${html}
    </div>
</section>`;
    }));

    const { email, ...publicConfig } = config;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: config.name,
        jobTitle: config.role,
        url: config.url,
        image: `${config.url}/content/preview.png`,
        sameAs: [config.github, config.linkedin].filter(Boolean),
    };
    const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

    const vars = {
        ...config,
        year: new Date().getFullYear(),
        banner: await read('content/banner.txt'),
        emailEncoded: encodeEmail(email),
        sections: sections.join('\n'),
        nav: PAGES.map(([name]) => `<a href="#${name}">${name}</a>`).join(''),
        configJson: json({ ...publicConfig, pages: PAGES.map(([name]) => name) }),
        jsonLd: json(jsonLd),
    };

    await fs.rm(dist, { recursive: true, force: true });
    await fs.mkdir(path.join(dist, 'content'), { recursive: true });

    for (const file of ['index.html', '404.html']) {
        await fs.writeFile(path.join(dist, file), fill(await read(file), vars, file));
    }
    for (const asset of ASSETS) {
        await fs.cp(path.join(root, asset), path.join(dist, asset), { recursive: true });
    }

    const today = new Date().toISOString().slice(0, 10);
    await fs.writeFile(path.join(dist, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${config.url}/</loc><lastmod>${today}</lastmod></url>
</urlset>
`);

    console.log(`built dist/ in ${Date.now() - started}ms`);
}

function serve(port = 8000) {
    const types = {
        '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
        '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf',
        '.xml': 'application/xml', '.txt': 'text/plain',
    };
    http.createServer(async (req, res) => {
        let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
        if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
        if (file.endsWith(path.sep)) file = path.join(file, 'index.html');
        try {
            const body = await fs.readFile(file);
            res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
        } catch {
            res.writeHead(404, { 'Content-Type': types['.html'] }).end(await fs.readFile(path.join(dist, '404.html')));
        }
    }).listen(port, () => console.log(`serving http://localhost:${port}`));

    let timer;
    const rebuild = () => {
        clearTimeout(timer);
        timer = setTimeout(() => build().catch((e) => console.error(e.message)), 100);
    };
    for (const p of ['content', 'js', 'index.html', '404.html', 'style.css']) {
        watch(path.join(root, p), { recursive: true }, rebuild);
    }
}

await build();
if (process.argv.includes('--serve')) serve(Number(process.env.PORT) || 8000);
