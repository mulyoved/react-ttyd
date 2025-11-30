# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TS React library. `Ttyd.tsx` entry; `components/terminal/*` Xterm/ttyd bridge; `components/modal/*` supporting UI; shared types in `types.ts`; exports in `index.ts`.
- `dist/`: Rollup output; regenerate via `npm run build`, never edit by hand.
- `example/nextjs`, `example/vite`: manual-test sandboxes; each needs its own `npm install`; run after a library build.
- `docs/API.md`: public prop reference; keep in sync with API changes.

## Build, Test, and Development Commands
- `npm install` — prefer npm (`package-lock.json`); touch `yarn.lock` only if you intentionally use yarn.
- `npm run dev` — Rollup watch build for local edits.
- `npm run build` — production bundle to `dist/`; required before publishing or running examples.
- `npm run lint` — ESLint with TypeScript + React rules.
- `npm run typecheck` — `tsc --noEmit` for static safety.
- `npm test` — Jest suite; place specs in `src/__tests__/` or alongside components.
- `npm run dev:example` / `npm run dev:example:vite` — build library then start the Next.js or Vite demo.

## Coding Style & Naming Conventions
- TypeScript + ESM; 2-space indent, single quotes, trailing commas to match existing files.
- Components in PascalCase; functions/variables camelCase; types/interfaces PascalCase.
- Prefer named exports; avoid `any` (ESLint warns via `@typescript-eslint/no-explicit-any`).
- React hooks rules enforced (`react-hooks/rules-of-hooks` error, `exhaustive-deps` warn); memoize when it prevents unnecessary renders.
- Run `npm run lint` and `npm run typecheck` before opening a PR.

## Testing Guidelines
- Use Jest; mock WebSocket/Xterm interactions to keep tests deterministic.
- Cover flow control, reconnect paths, and prop-driven rendering; add regression tests for bug fixes.
- For UI/interactive tweaks, smoke-test through the example apps and note steps in the PR.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.) consistent with history.
- PR checklist: summary, linked issue (if any), test commands executed (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`), and screenshots/gifs for UI changes.
- Keep diffs focused; avoid committing generated `dist/` or unintended lockfile updates.
- Reflect public API updates in `docs/API.md` and `src/index.ts`.

## Security & Configuration Tips
- Do not commit real `wsUrl`, tokens, or credentials; use placeholders or env vars.
- Default configs should be safe for local use; avoid values that could hit external endpoints by default.
