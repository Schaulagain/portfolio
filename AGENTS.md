## Working here

- Page text lives in `content/*.md`. `npm run build` renders it into `dist/`, which is ignored by git and deployed to GitHub Pages on every push to `master`. `npm run dev` serves it locally.
- The CV text lives in `tools/resume.py`. Keep it in step with `content/experience.md` and `content/skills.md`. Rebuild with `python3 tools/resume.py screen resume.docx` (needs python-docx), then `soffice --headless --convert-to pdf resume.docx`. The `print` mode makes Suman's paper copy with his phone number, and that copy stays out of the repo.

## Writing style

Everything a reader sees (`content/*.md` and the CV) is in Suman's own voice, plain and casual, the way a person talks.

- Bold is for structure only: headings, job titles, skill labels. Sentences are plain text.
- Describe work at the level of what was owned and why it mattered. Step-by-step detail lives in each project's own README.
- Site pages use first person with contractions. CV bullets start with a past-tense verb and leave out "I".
- Tech stacks are plain comma lists.
- AI-agent involvement is told once, in the "How this was built" section of each README.
- Laravel is the framework he names. Payment gateway names go in the skills list.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
