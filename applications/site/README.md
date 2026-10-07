# Job findings site

One page with 50 roles. Each role has the posting link, the job description, a fit check against your resume, a
cover letter and a resume tailored to the role. Nothing is sent anywhere.

## Run it on your computer

```sh
git checkout claude/stoic-archimedes-wkim4r
cd applications/site
node serve.mjs
```

Open <http://localhost:4173>. Needs Node 18 or newer and nothing else. `PORT=8080 node serve.mjs` changes the port.
On localhost the page also shows **Download .docx** and **Print / save as PDF** for each letter and resume.

You can also open `index.html` directly from disk. It works, but the download buttons only appear on `localhost`.

## What is here

| Path | What it is |
|---|---|
| `index.html` | The whole page with the data inlined (generated) |
| `documents/` | A `.docx` cover letter and resume per role, 100 files (generated) |
| `template.html` | Page markup, styles and script |
| `serve.mjs` | Static server for `index.html` and `documents/` only |
| `tools/facts.py` | Every fact used in letters and resumes, from your resume and what you told me |
| `tools/roles_data.py` | The 50 roles: facts, a one-sentence hook for each letter, fit checks |
| `tools/linkedin_roles.json` | Full posting text for the 18 LinkedIn roles |
| `tools/generate.py` | Rebuilds everything |

## Change something and rebuild

```sh
pip install python-docx
python3 tools/generate.py
```

Edit a fact in `tools/facts.py` (your CCRA status, a phone number) or a role in `tools/roles_data.py`, then rebuild.
Letters and resumes are assembled only from those two files, so a fact you fix there is fixed in all 100 documents.

## Confirm before sending

- **CRA role:** every resume now lists Clinical Research Associate, breast/oncology, IU Simon Comprehensive Cancer
  Center, 2022 to 2023. Only the title and years are known, so the entry has no bullets. Add 2 to 3 duties in
  `tools/facts.py` (`CRA_JOB`) and rebuild.
- **CCRA:** shown as "earned 2023; expired, recertification in process".
- **Move:** letters say you are planning to move to Sacramento or the greater Sacramento area.
- **License:** letters say the California PA license application is in process, expected January 2027.

Postings change quickly. Confirm each is still open.

## Downloads

- On `localhost` each letter and resume has a **Download .docx** link and a **Print / save as PDF** button.
- In the published claude.ai version the same **Download .docx** button asks you to confirm, then saves the file.
- Either way, all 100 files are also in `documents/`.
