# Contributing

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project.

## Repository layout

This repo is a monorepo managed with Bun workspaces.

- `packages/react-native-screen-transitions` – the published library (built with `react-native-builder-bob`).
- `apps/harness` – Expo app with one lab per library mechanism, driven by the visual e2e suite (`apps/harness/e2e`, see its README).

## Development workflow

### 1. Set up your environment

Install dependencies from the repo root:

```sh
bun install
```

### 2. Build the library

Compile the library:

```sh
bun run build
```

### 3. Run the harness app

The harness bundles the library from source, so it doesn't need a build:

```sh
cd apps/harness
npx expo run:ios --configuration Release   # or expo run:android --variant release
```

## Quality checks

We use TypeScript, Biome (lint + format), Bun tests, and a visual e2e suite driven by Argent.
Make sure everything passes before sending a PR.

Behavior is checked visually: the e2e suite records each scenario on a simulator or emulator and flags
blanks, flickers and jumps frame by frame. Unit tests cover what a recording can't pin down: pure logic
(gesture physics, snap targets, bounds math, route reconciliation), public API contracts, and the
frame-by-frame harness that checks the same visual invariants in CI. Don't add tests that only pin
implementation wiring (subscription identity, re-render counts); they break on refactors and catch
nothing a user would see.

```sh
# From repo root
bun run lint       # biome check
bun run typecheck  # tsc --noEmit
bun test           # unit tests
bun run test:harness  # frame-by-frame harness tests, one process per file
bun run test       # both

# Visual e2e (Release harness app on a booted simulator or emulator, Argent CLI)
apps/harness/e2e/run-all.sh <simulator UDID or adb serial> <outDir>
```

Tests share a process. For file-specific module overrides, use `createModuleMock`
from the library’s `src/__tests__/helpers/mock-module.ts` and await each replacement. It preserves
unmodified exports and restores replacements after the file finishes. Keep shared
native dependency stubs in `test/setup.ts`; direct `mock.module()` calls in test
files leak into other tests.

Biome auto-fixes many issues:

```sh
biome check packages/react-native-screen-transitions/src --write
```

## Scripts

From the repo root:

| Script | Description |
|--------|-------------|
| `build` | Compiles the library via bob |
| `lint` | Runs Biome on the library |
| `typecheck` | Type-checks the library |
| `clean` | Removes node_modules and lockfiles |
| `release:alpha` | Publishes a local alpha prerelease from the current branch |
| `release:beta` | Publishes a local beta prerelease from the current branch |
| `release:rc` | Publishes a local release candidate from the current branch |

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

## Docs

Docs are maintained in Mintlify outside this repository.

## Sending a pull request

- Prefer small PRs focused on one change
- Verify lint, typecheck, tests, and relevant e2e checks pass
- If your PR changes public behavior, update the corresponding Mintlify docs before release
- Breaking changes must update migration docs before release
