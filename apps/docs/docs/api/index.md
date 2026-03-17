---
title: API Reference
sidebar_position: 1
slug: /api
---

# API Reference

The generated API docs are here for exact types and exports, not for the first pass through the library. Use the guides first, then come here when you need precise signatures.

## Public entry points

- `react-native-screen-transitions`
- `react-native-screen-transitions/blank-stack`
- `react-native-screen-transitions/native-stack`
- `react-native-screen-transitions/component-stack`

## Jump directly to a reference section

- [Root package exports](/docs/api/reference)
- [Shared exports](/docs/api/reference/shared)
- [Blank stack](/docs/api/reference/blank-stack)
- [Native stack](/docs/api/reference/native-stack)
- [Component stack](/docs/api/reference/component-stack)

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
