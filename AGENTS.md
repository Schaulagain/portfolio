## Working here

- Page text lives in `content/*.md`. `npm run build` renders it into `dist/`, which is ignored by git and deployed to GitHub Pages on every push to `master`. `npm run dev` serves it locally.
- `resume.pdf` and `resume.docx` are maintained by hand. Keep them in step with `content/experience.md` and `content/skills.md` when either changes.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
