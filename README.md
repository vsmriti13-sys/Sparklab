# SparkLab

A standalone research-to-activity studio for Erasmus+ teacher trainers. Separate from QuestCraft and Island Simulation Lab.

## Run locally

Use Node.js 20.9+ (tested with Node 24). Run `npm ci`, then `npm run dev`. Open port 3000. `npm test` checks brief validation and demonstration exports; `npm run build` validates the production build.

No credentials are required for the labelled demonstration mode. The demo uses a fixed workshop structure with your topic; it performs no research and does not support AI revisions.

## Enable live mode

Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` privately. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash`) and `AI_PROVIDER=gemini`. Restart the server. On Vercel, import this repository as a Next.js project and enter those variables in project settings. Never prefix keys with `NEXT_PUBLIC_` or commit them. Gemini free-tier eligibility, regional availability, quotas, and model availability depend on your Google account; no free usage is guaranteed.

The server calls Crossref's scholarly search tool, sends retrieved metadata and the brief to the provider, creates a workshop, and runs a separate critical review. The UI shows sources separately from AI design hypotheses. Crossref records verify bibliographic identity, not research findings. Read the original papers before using evidence claims. No full text is retrieved or verified in this prototype. Search may return irrelevant records: inspect them before approval.

## Approval, revisions, and exports

Approve & save keeps activities in this browser's localStorage. Existing accepted titles are supplied to the live provider as avoidance context; semantic duplicate prevention is advisory, not guaranteed. The demo uses one repeatable structure. AI revisions regenerate research and the activity using your requested changes, and require approval again. Download exports a Markdown facilitator pack with participant invitations, reflection prompts, materials, UDL notes, review, and sources. Browser data is neither synced nor backed up; download important packs. Approval represents your judgment, not independent validation.

## Provider and deployment boundary

`lib/providers.mjs` contains server-only search and model adapters; `app/api/workflow/route.js` orchestrates research → creation → review. Replace or extend the provider adapter without changing the interface. API errors never silently become demo results. Keys are read only by the server.

No database, paid search, analytics, or account service is used. Live briefs and source metadata are sent to Google; do not include personal learner data. An unauthenticated public deployment exposes a billable API endpoint: keep this personal prototype behind Vercel Deployment Protection or add authentication and durable rate limiting before public release. The prototype has input limits and request timeouts, but no distributed quota enforcement. Research and review remain advisory, and facilitator approval is required.
