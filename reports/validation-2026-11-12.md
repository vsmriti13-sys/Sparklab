# SparkLab validation — 12 November 2026

## Verified in this workspace

- Production build succeeds with `/api/studio` and `/api/export`; the obsolete demo endpoint is removed.
- Eight automated regression tests pass: source normalization, exact-quote/source-selection integrity, signed workflow tokens, review gating, binary formats, model discovery, quota and timeout handling.
- A browser regression run exercised source selection → design → independent review → approval → four downloads → browser-local persistence. Model/research responses in this regression run were explicitly test fixtures; download responses came from the actual production HTTP exporter. There were no browser exceptions or horizontal overflow at 390px width.
- Real `.pptx`, participant `.docx`, participant `.pdf`, and separate facilitator `.docx` binaries were generated. Python's Office parsers and PyMuPDF opened them and verified task content, response space, references, and separation of a private facilitator sentinel from participant material.
- LibreOffice 25.2.3 opened the PowerPoint and both Word documents and successfully converted them to PDF. The first render had 12 slide pages, 3 participant Word pages, and 3 facilitator Word pages. After removing a facilitator-directed UDL appendix from the participant deck, the final deck has 11 pages. A contact sheet of the first render was visually inspected. The direct worksheet PDF has 3 pages and text stayed within horizontal page margins.
- Export-function tracing includes both bundled Unicode font files and their license for deployment.

## Not yet verified: real research-to-model run

The local runtime has no `GEMINI_API_KEY`. The running network policy does not include Crossref or the user's Vercel hostname. Fresh HTTPS requests to `api.crossref.org` and `sparklab-4x4rym0o8-vsmriti13-4212s-projects.vercel.app` failed at the proxy with CONNECT 403; no source records or live model output were obtained in this task.

The reusable network draft includes those domains, and updated startup instructions have been saved. Draft persistence does not apply the network policy or publish the environment. No real-topic success is claimed from fixture-based tests, and fixture files are not offered as teaching deliverables.

## Remaining live acceptance test

1. Apply the pending cloud environment network settings.
2. Deploy this commit in the user's Vercel project with its existing private Gemini binding. Obtain the current production URL if the supplied deployment-specific URL still points to old code. Alternatively, configure the local runtime key securely in environment settings.
3. Run `node scripts/validate-live.mjs CURRENT_URL` for **retrieval practice and durable learning**. The script saves all actual retrieved source records, selected source links, the real generated pack and four actual HTTP downloads. It fails on blocked access, missing credentials, invalid content, or unresolved review checks.
4. Run `python scripts/check-files.py OUTPUT_DIRECTORY`, open/render all Office files, inspect all rendered pages and the direct PDF, and report source links and final downloadable files. Human pedagogical inspection remains necessary even if AI review passes.

Until this acceptance test completes, live generation and the full real-topic workflow remain unverified.
