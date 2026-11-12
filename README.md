# SparkLab — Educational research and teaching-material studio

Standalone Next.js application for Erasmus+ teacher trainers and classroom teachers. It is separate from QuestCraft and Island Simulation Lab. No database, paid search service, mock research, demonstration generator, or Markdown deliverable is used.

## Workflow

1. Define a classroom lesson or teacher-training workshop: topic, measurable objectives, actual participant age, duration, group size, course context and access needs.
2. Search Crossref for actual publication records and abstracts where available. Inspect the source links and select 1–5 resources. Metadata-only sources are labelled and cannot substantiate findings. Search relevance must be checked by the user.
3. Gemini designs the selected instructional context: usable participant task instructions, original scenarios/readings/data, worksheet prompts, expected responses in a separate facilitator section, UDL supports and a research-to-design rationale. Exact quoted abstract excerpts are checked against the retrieved text. Unsupported quotes and citations to unselected sources fail validation.
4. A separate model call reviews pedagogy, UDL, audience/age, feasibility, evidence integrity, and separation of private answers. Failed checks block approval and downloads. Request a revision, then review again.
5. Approve the reviewed design, save it in this browser, and download actual files:
   - Editable participant PowerPoint (`.pptx`), with tasks and stimulus; no facilitator notes or answer fields.
   - Editable participant worksheet (`.docx`) with stimulus, prompts and response space.
   - Printable A4 participant worksheet (`.pdf`) with embedded Unicode fonts and pagination.
   - Separate facilitator guide (`.docx`) with preparation, possible responses, assessment, adaptations, research rationale and source links.

All exports use the same validated content. Slides paginate at a readable 22-point body size rather than shrinking text to fit. Word and PDF worksheets contain the same tasks; pagination can differ. The facilitator guide uses logical step numbers matching the slides. Participant decks do not include hidden answer notes. User approval is a professional judgment, not proof of efficacy or originality.

## Setup and Vercel

Node.js 20.9+ (tested on Node 24).

```bash
npm ci --cache /tmp/sparklab-npm
npm run dev
```

Copy `.env.example` to an untracked `.env.local` and set `GEMINI_API_KEY` securely, or set it in Vercel project environment variables. Optional: `GEMINI_MODEL=gemini-2.5-flash`, `AI_PROVIDER=gemini`. Keys are server-only. Gemini free-tier availability depends on account, region, selected model and quota; costs are not guaranteed to be zero. 404 model failures trigger discovery of an available stable Flash model; quota failures do not trigger switching. Gemini 2.5 Flash uses a zero thinking budget to reduce latency.

Deploy from the GitHub repository with Vercel's Next.js defaults and a supported Node runtime. `/api/studio` declares 180 seconds; the actual available function duration depends on deployment settings. Research, design and review are separate requests. Pending stages stay in the current page until navigation/refresh. Signed research/design tokens expire after two hours. Approved browser-local packs can still export after tokens expire, but regeneration requires a fresh search. Use the **current production domain**, not an old deployment-specific URL, when testing updates.

Research needs `api.crossref.org`; generation needs `generativelanguage.googleapis.com`. Downloads do not call Gemini. Bundled DejaVu fonts and their license are in `assets/fonts`; Next.js tracing explicitly includes them in the export function. The inherited interface optionally loads Google Fonts; these are not needed for exported files.

For cloud tasks, use the existing checkout `/workspace/Sparklab`; do not create a Git worktree unless explicitly requested. Retained files and dependencies survive separately from live processes; restart `npm run dev` as needed.

## Validation: distinguish regression checks from live evidence

```bash
npm test
npm run build
node scripts/validate-live.mjs https://YOUR-CURRENT-PRODUCTION-DOMAIN.vercel.app
python scripts/check-files.py /tmp/sparklab-live-TIMESTAMP
```

The live script uses a real topic, **retrieval practice and durable learning**, retrieves actual sources, selects relevant retrieved abstracts, calls the real model, reviews the design, and downloads all four files through the actual HTTP export endpoint. It stops on missing credentials, denied access, unavailable sources, invalid content or unresolved review failures. There is no fake success path. Source and output JSON are retained beside the files for inspection. The script's approval is a validation-run approval, not a saved user approval.

Afterward, open the `.pptx` and `.docx` files in PowerPoint/Word or LibreOffice. Render to PDF and inspect all pages for missing tasks, clipped text, stimulus availability, answer leakage and age fit. Open the direct worksheet PDF too. A passing build or a ZIP signature alone is insufficient.

`npm test` uses clearly marked fixtures solely for regression checks (schema, source integrity, model errors and binary exporters). Fixtures are never loaded by the application and are not evidence of a live research-to-materials run. Python inspection additionally needs `python-pptx`, `python-docx`, and `PyMuPDF`; these are validation tools, not application runtime dependencies.

## Evidence, privacy and limits

Crossref discovery currently covers publication metadata and available abstracts, not paywalled full text, a systematic review, or unrestricted web research. A source record proves identity; an exact abstract excerpt is retrieved text, not independent verification of its findings. Source selection, relevance, quality and applicability require human review. AI rationales and instructional designs are labelled as suggestions. The reviewer can miss semantic answer leakage or pedagogical flaws; inspect the previews before approval.

Saved packs live only in this browser (`sparklab-studio-v1`) and are not synced or backed up. Earlier activity-generator storage is left untouched and is not misrepresented as complete teaching packs. Accepted pack titles are provided to Gemini as avoidance context; novelty/duplicate avoidance is advisory. Do not include personal learner information in briefs sent to Google. Keep deployments access-protected while using a personal key: the application has no account login or durable rate limiter. The export endpoint is stateless and can export a validated user-approved pack; it is not a cryptographic certificate of research quality. No credentials or live research tokens belong in GitHub.
