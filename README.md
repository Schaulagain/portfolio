# sumanchaulagain.info.np

My portfolio site. The top is a terminal you can type commands into, and the same content is underneath as a normal page.

## Editing content

Everything lives in `content/`:

| File | What it is |
| --- | --- |
| `config.md` | Name, role, links, SEO description, neofetch info (`key: value` lines) |
| `about.md`, `experience.md`, `projects.md`, `skills.md`, `hobbies.md`, `contact.md` | One page each; also a terminal command each |
| `banner.txt` | ASCII art shown when the terminal starts |
| `preview.png` | Social preview image (1200×630) |

To add a page, create `content/<name>.md` and add its name to `PAGES` in `tools/build.mjs`.
It shows up as a section on the page and as a terminal command.

## Running locally

```sh
npm run dev     # builds, serves http://localhost:8000, rebuilds on save
npm run build   # one-off build into dist/
```

No npm dependencies. You only need Node 20 or newer.

## Deploying

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds `dist/` and publishes it to GitHub Pages.
Cloudflare sits in front of it.
