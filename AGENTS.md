# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the React application, including `App.jsx`, `main.jsx`, styles, and route-driven pages.
- `src/data/works.js` holds curated seed works; `src/data/submissions.json` holds approved Issue submissions.
- `src/assets/images/` contains Vite-managed gallery artwork. Import images from source files rather than constructing URLs manually.
- `scripts/` contains submission parsing, data appending, Pages preparation, and Node tests.
- `.github/ISSUE_TEMPLATE/` defines the structured submission form. `.github/workflows/` contains CI, submission, cleanup, and Pages automation.

## Build, Test, and Development Commands

```text
npm install                 # Install dependencies
npm run dev                 # Start the Vite development server
npm run test:submission     # Run Issue submission parser tests
npm run build               # Build the site and create dist/404.html
npm run preview             # Preview the production build locally
```

For Pages-path testing, use `VITE_BASE_PATH=/lty-moe/ npm run build` (PowerShell: `$env:VITE_BASE_PATH='/lty-moe/'; npm run build`).

## Coding Style & Naming Conventions

Use two-space indentation, semicolons only when needed, single-quoted JavaScript strings, and trailing commas in multiline structures. Use `PascalCase` for React components, `camelCase` for functions and variables, and kebab-case for asset filenames and workflow names. Keep components and data structures straightforward; avoid introducing a dependency for a small utility.

## Testing Guidelines

Tests use Node’s built-in `node:test` runner and are named `*.test.mjs` under `scripts/`. Add focused parser tests for new Issue-form fields or validation rules. Run `npm run test:submission` and `npm run build` before opening a PR.

## Commit & Pull Request Guidelines

Use concise conventional-style subjects such as `fix: ...`, `feat: ...`, or `chore: ...`; include a `Signed-off-by` line because the repository runs DCO checks. PRs should explain the change, link the relevant Issue when applicable, include screenshots for visual changes, and confirm tests/build results. The required `build` check must pass before merging.

## Security & Automation Notes

Do not place user-provided Issue content directly in shell commands. Submission workflows must validate HTTPS GitHub attachment URLs and preserve idempotency. Dependabot fixes should be verified with `npm audit`; Pages paths must remain derived from GitHub Pages configuration.
