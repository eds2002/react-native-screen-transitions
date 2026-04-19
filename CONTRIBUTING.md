# Contributing

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project.

## Repository layout

This repo is a monorepo managed with Bun workspaces.

- `packages/react-native-screen-transitions` – the published library (built with `react-native-builder-bob`).
- `apps/e2e` – Expo app for interactive transition demos and e2e testing with Maestro.

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

## Docs

Docs are maintained in Mintlify outside this repository.

## Sending a pull request

- Prefer small PRs focused on one change
- Verify lint, typecheck, tests, and relevant e2e checks pass
- If your PR changes public behavior, update the corresponding Mintlify docs before release
- Breaking changes must update migration docs before release
