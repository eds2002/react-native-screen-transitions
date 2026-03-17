# Contributing

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project.

## Repository layout

This repo is a monorepo managed with Bun workspaces.

- `packages/react-native-screen-transitions` – the published library (built with `react-native-builder-bob`).
- `apps/e2e` – Expo app for interactive transition demos and e2e testing with Maestro.
- `apps/docs` – Docusaurus docs site for guides, versioned docs, and generated API reference.

## Development workflow

### 1. Set up your environment

Install dependencies from the repo root:

```sh
bun install
```

### 2. Build the library

Compile the library before running the e2e app:

```sh
bun run build
```

### 3. Run the e2e app

```sh
cd apps/e2e
npx expo run:ios   # or expo run:android
```

## Quality checks

We use TypeScript, Biome (lint + format), Bun tests, and Maestro for e2e. Make sure everything passes before sending a PR.

```sh
# From repo root
bun run lint       # biome check
bun run typecheck  # tsc --noEmit
bun test           # unit tests
bun run docs:api   # regenerate API markdown from public entrypoints
bun run docs:build # verify the docs site builds

# E2e tests (requires Maestro CLI + iOS simulator)
cd apps/e2e
npx expo run:ios --configuration Release
maestro test .maestro/complete.yaml
```

Biome auto-fixes many issues:

```sh
biome check packages/react-native-screen-transitions/src --write
```

## Scripts

From the repo root:

| Script | Description |
|--------|-------------|
| `build` | Compiles the library via bob |
| `docs:dev` | Starts the Docusaurus docs site |
| `docs:build` | Builds the docs site |
| `docs:api` | Regenerates markdown API reference from TypeScript |
| `docs:version` | Creates a versioned docs snapshot (for example `bun run docs:version 3.x`) |
| `lint` | Runs Biome on the library |
| `typecheck` | Type-checks the library |
| `clean` | Removes node_modules and lockfiles |
| `release` | Publishes the package using `release-it` |

Inside `packages/react-native-screen-transitions`:

| Script | Description |
|--------|-------------|
| `build` | `bob build` - emits CJS/ESM/types |
| `lint` | Runs Biome |
| `typecheck` | Type-check only |

## Commit message convention

We follow [conventional commits](https://www.conventionalcommits.org/en):

- `fix`: bug fixes
- `feat`: new features
- `refactor`: code refactor
- `docs`: documentation changes
- `test`: adding or updating tests
- `chore`: tooling changes

## Docs and release flow

- `3.x` is the stable docs lane
- `Next` is the unreleased docs lane for alpha, beta, and rc work
- Regenerate API docs with `bun run docs:api` whenever the public export surface changes
- Snapshot a stable docs line with `bun run docs:version 3.x` when a stable release is ready to freeze
- GitHub Pages deployment happens through `.github/workflows/docs.yml`

## Sending a pull request

- Prefer small PRs focused on one change
- Verify lint, typecheck, tests, and docs build pass
- If your PR changes public behavior, update at least one guide, release note, or migration note
- If your PR changes the public API surface, regenerate `apps/docs/docs/api/reference`
- Breaking changes must update migration docs before release
