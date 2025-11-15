# Contributing

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project.

## Repository layout

This repo is a small monorepo managed with Bun workspaces, Changesets, and Lerna Lite.

- `packages/react-native-screen-transitions` – the published library (built with `react-native-builder-bob`).
- `examples/expo-router-example` – the main Expo Router development app (requires a dev build).
- `examples/onboarding-example` – minimal example for onboarding-style transitions.
- `e2e/maestro` – Maestro-powered regression scenarios.

## Development workflow

### 1. Set up your environment

Install dependencies from the repo root. We use Bun by default (see `bun.lock`), but Yarn or pnpm will also work if you prefer.

```sh
# Recommended
bun install

# Or
yarn install
pnpm install
```

### 2. Build and link local packages

Compile the library once before running an example app:

```sh
bun run build
# runs `lerna run prepack` which calls `bob build` in each package
```

### 3. Run an example app

Most UI/gesture changes should be tested in `examples/expo-router-example`:

```sh
cd examples/expo-router-example
```

First run (requires native deps):

```sh
npx expo run:ios   # or expo run:android
```

Subsequent runs:

```sh
bun start          # Metro dev server
bun run ios        # launch iOS dev build
bun run android    # launch Android dev build
```

The onboarding example lives in `examples/onboarding-example` and can be run with the same commands as any bare React Native app after `bun install`.

## Quality checks

We rely on TypeScript, Biome (lint + format), Bun tests, and Maestro flows. Please make sure everything passes before sending a PR.

```sh
# From packages/react-native-screen-transitions
bun run lint       # biome check ./src
bun test           # runs Bun-powered unit tests

# Optional type-only build (tsconfig.build.json)
bun run build

# From repo root (requires Maestro CLI)
bun run e2e
```

Biome auto-fixes many issues via:

```sh
biome check ./src --write
```

but please only run it inside the package you touched.

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, eg add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Scripts

Helpful workspace-level scripts (run from the repo root with `bun run …`, `yarn …`, or `pnpm …`):

- `build` – runs `lerna run prepack` to compile every package via Bob.
- `clean` – removes each package’s build output plus the workspace `node_modules`.
- `e2e` – executes the Maestro flows under `e2e/`.
- `changeset`, `changeset:version`, `changeset:publish` – standard Changesets lifecycle.
- `release` – convenience script that builds and publishes (`bun run build && bun run changeset:publish`).

Inside `packages/react-native-screen-transitions` you’ll also find:

- `bun run build` – calls `bob build` to emit CJS/ESM/types.
- `bun run lint` – runs Biome.
- `bun test` – Bun’s built-in test runner (see `src/__tests__`).

### Changesets & releases

- If your change affects user-facing behavior (API additions, fixes, etc.), run `bun run changeset` and follow the prompt so we can version the package correctly.
- Changesets live under `.changeset/`. They are consumed during release (`bun run changeset:version`) so make sure they describe the change and bump type accurately.
- Docs-only or repo-chore changes don’t need a changeset unless they impact a published package.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that Biome, Bun tests, and (when relevant) Maestro flows are passing.
- Review the documentation and example apps to make sure they reflect the change.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
- Include a Changeset when the public package needs a version bump.
