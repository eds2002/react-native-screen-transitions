---
title: API Reference
sidebar_position: 1
slug: /api
---

# API Reference

The API reference is generated from the package's public entrypoints:

- `react-native-screen-transitions`
- `react-native-screen-transitions/blank-stack`
- `react-native-screen-transitions/native-stack`
- `react-native-screen-transitions/component-stack`

## What is intentionally excluded

- internal implementation modules
- non-exported helpers
- repo-only demo code

## Regenerating the reference

From the repo root:

```bash
bun run docs:api
```

That command writes markdown into `apps/docs/docs/api/reference`, which is then built by Docusaurus like the rest of the docs.
