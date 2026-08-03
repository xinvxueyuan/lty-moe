# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the React Router application: routes, components, styles, and shared data types.
- `src/db/` holds SQLite schema and the server-side database client (`client.server.ts`).
- `src/data/examples.ts` holds demo seed works inserted at runtime when the database is empty.
- `src/lib/validate-work.ts` validates upload form input; `src/lib/api.ts` is the browser fetch client for resource APIs.
- `src/assets/images/` contains Vite-managed gallery artwork used by seed data.
- `server.js` is the production Node HTTP server (SSR + static `/uploads` and client assets).
- `.github/workflows/` contains CI and CodeQL automation.

## Rendering Strategy (hybrid SPA + SSR)

Keep `ssr: true` globally. Choose data loading per route:

| Kind         | Routes                                | How data loads                                        |
| ------------ | ------------------------------------- | ----------------------------------------------------- |
| SSR document | `/`, `/works/:id`, `/creator/:handle` | server `loader` → SQLite                              |
| SPA data     | `/explore`, `/following`              | `clientLoader` + `HydrateFallback` → `GET /api/works` |
| Mutation     | `/upload`                             | server `action` (multipart + disk + SQLite)           |
| Resource API | `/api/works`, `/api/works/:id`        | loader-only modules returning `Response.json`         |

Do not import `.server.ts` or sqlite3 from client-only modules. Prefer shared DB helpers for both page loaders and API routes.

## Build, Test, and Development Commands

```text
npm install                 # Install dependencies (sqlite3 install script is allowlisted)
npm run dev                 # Start the React Router / Vite development server
npm run typecheck           # Generate route types and run tsc --noEmit
npm run lint                # ESLint
npm run format:check        # Prettier check
npm run test:unit           # Node test runner (validate-work + db client)
npm run build               # Production client + SSR build → build/
npm run start               # Production server (node server.js)
npm run test:e2e            # Playwright end-to-end tests
```

Environment variables for local production runs:

```text
DATABASE_PATH   # SQLite file path (default: ./data/lty-moe.db)
UPLOADS_DIR     # Upload directory (default: ./uploads)
PORT            # HTTP port (default: 3000)
```

## Coding Style & Naming Conventions

Use two-space indentation, semicolons only when needed, single-quoted JavaScript/TypeScript strings, and trailing commas in multiline structures. Use `PascalCase` for React components, `camelCase` for functions and variables, and kebab-case for asset filenames and workflow names. Keep components and data structures straightforward; avoid introducing a dependency for a small utility. Server-only modules use the `.server.ts` suffix.

## Testing Guidelines

Unit tests use Node’s built-in `node:test` runner and live next to source as `*.test.ts` under `src/lib/` and `src/db/`. Cover form validation rules and SQLite seed/CRUD paths. Run `npm run test:unit`, `npm run typecheck`, and `npm run build` before opening a PR.

## Commit & Pull Request Guidelines

Use concise conventional-style subjects such as `fix: ...`, `feat: ...`, or `chore: ...`; include a `Signed-off-by` line because the repository runs DCO checks. PRs should explain the change, link the relevant Issue when applicable, include screenshots for visual changes, and confirm tests/build results. The required `build` check must pass before merging.

## Security & Deployment Notes

User-uploaded images are stored on disk under `UPLOADS_DIR` and served from `/uploads/` with path traversal checks. Persist `data/` and `uploads/` volumes in Docker or VPS deploys. Dependabot fixes should be verified with `npm audit`. Do not reintroduce GitHub Issues/Discussions as a data store.
