<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# No Mock Data — Ever

**STRICT RULE: Mock data, hardcoded sample values, placeholder charts, and fake metrics are absolutely forbidden anywhere in this codebase.**

- Every dashboard, chart, table, and metric displayed on the platform MUST be fetched from its real integration (Google Search Console, Google Analytics, etc.).
- If an integration is not connected or returns no data, show a proper empty state (e.g. `EmptyState` component) — never substitute fake or illustrative data.
- Every integration must be fully and correctly implemented end-to-end: auth, data fetching, error handling, and display.
- Never use `Math.random()`, hardcoded arrays of fake records, or any static stand-in data as a temporary measure. There is no such thing as "temporary" mock data — it always ships.
- If real data cannot be shown (missing credentials, API error, empty response), surface a clear, honest UI state explaining why — not a chart filled with zeros or invented numbers.
- Before marking any feature complete, verify that the data rendered comes from the live integration, not a local constant or seed file.
