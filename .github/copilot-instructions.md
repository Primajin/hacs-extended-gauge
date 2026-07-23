# GitHub Copilot Instructions

## Project Overview

This is a HACS (Home Assistant Community Store) custom card called **Extended Gauge Card** — a gauge card with multiple configurable segments for Home Assistant dashboards. It is built with TypeScript and [Lit](https://lit.dev/), bundled with Rollup, and distributed as a single `dist/extended-gauge.js` file.

## Allowed External Resources

The following domains are on the custom allowlist and can be accessed for research:

- `github.com`
- `github.io`
- `hacs.xyz`

## Session Workflow

### 0. Branching for upstream contributions

When working on changes intended for upstream contribution, **do not branch from this fork's local `main` by default** if it has diverged from upstream history.

- Treat the upstream repository's default branch as the starting point for contribution branches.
- Create fresh work branches from `upstream/main` (or the upstream default branch if different), not from `origin/main`, whenever the goal is a clean upstream PR.
- If uncertain about the correct upstream branch, check remotes and branch relationships before creating the branch.
- Avoid including fork-only divergence commits in contribution branches intended for upstream.
- If changes already exist on a branch based on the fork's divergent history, prefer recreating a clean branch from upstream and cherry-picking only the relevant new commits.

### 1. Start of Session — Install Dependencies

Always begin by installing dependencies before making any changes:

```sh
npm install
```

Or, if using pnpm (the preferred package manager for this project):

```sh
pnpm install
```

### 2. Make Changes

- Follow existing code style and conventions found in `src/`.
- Keep changes focused and minimal.
- Do not introduce new dependencies unless absolutely necessary.
- TypeScript strict mode is enforced — ensure all types are correct.

### 3. End of Session — Validate and Build

Run the following checks **in order** before finishing:

```sh
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format check (or auto-fix)
pnpm format:check
# If formatting issues are found, auto-fix with:
pnpm format:write

# Tests
pnpm test

# Build — regenerates dist/extended-gauge.js
pnpm build
```

All checks must pass with no errors before committing.

### 4. End of Session — Commit `dist/extended-gauge.js`

After a successful build, **always commit the updated `dist/extended-gauge.js`** along with your source changes. This file is the distributable used by HACS and must be kept in sync with every change.

```sh
git add dist/extended-gauge.js
git add src/ # and any other changed files
git commit -m "feat: <description of change>"
```

## Code Conventions

- **Language**: TypeScript (strict mode via `tsconfig.json`)
- **Component framework**: [Lit](https://lit.dev/) (LitElement)
- **Bundler**: Rollup (`rollup.config.js`)
- **Test framework**: Jest (`jest.config.ts`)
- **Linter**: ESLint with TypeScript and open-wc configs
- **Formatter**: Prettier
- **Commit style**: [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `fix:`, `chore:`)

## Project Structure

```
src/          # TypeScript source files
dist/         # Built output — extended-gauge.js must be committed
docs/         # Documentation assets
utils/        # Utility scripts
```

## Home Assistant / HACS Specifics

- This card is registered as a custom element and loaded by Home Assistant's Lovelace UI.
- Configuration schema is defined using [superstruct](https://docs.superstructjs.org/).
- When adding or changing card configuration options, update both the TypeScript types and the editor element in `src/`.
- Refer to [HACS documentation](https://hacs.xyz) and [Home Assistant developer docs](https://developers.home-assistant.io) for integration guidelines.
