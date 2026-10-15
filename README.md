# sumanchaulagain.info.np

My portfolio: an interactive terminal on top, the same content as a regular page below.

## Editing content

Everything lives in `content/`:

| File | What it is |
| --- | --- |
| `config.md` | Name, role, links, SEO description, neofetch info (`key: value` lines) |
| `about.md`, `experience.md`, `projects.md`, `skills.md`, `hobbies.md`, `contact.md` | One page each; also a terminal command each |
| `banner.txt` | ASCII art shown when the terminal starts |
| `preview.png` | Social preview image (1200×630) |

To add a page, create `content/<name>.md` and add it to `PAGES` in `tools/build.mjs`.
It becomes a section on the page and a terminal command automatically.

## Running locally

```sh
npm run dev     # builds, serves http://localhost:8000, rebuilds on save
npm run build   # one-off build into dist/
```

No dependencies — just Node 20+.

## Deploying

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds `dist/` and publishes it to GitHub Pages.
Cloudflare sits in front as the proxy/CDN.
