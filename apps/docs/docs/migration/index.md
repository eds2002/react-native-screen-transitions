---
title: Migration Notes
sidebar_position: 1
---

# Migration Notes

The package is evolving quickly, so migration guidance matters more than a perfect changelog diff.

## Current 3.x migration rules

### Prefer `navigationMaskEnabled` over `maskEnabled`

`maskEnabled` is deprecated. Use `navigationMaskEnabled` for bounds navigation masking going forward.

### Prefer slot-based interpolator output

The slot-based return format is the canonical shape:

```tsx
return {
  content: {
    style: { opacity: 1 },
  },
  backdrop: {
    style: { opacity: 0.5 },
  },
};
```

Legacy flat keys such as `contentStyle` and `backdropStyle` still work, but they are treated as a backward-compatibility path.

### Prefer `sheetScrollGestureBehavior` over `expandViaScrollView`

`expandViaScrollView` is deprecated. Use:

- `"expand-and-collapse"`
- `"collapse-only"`

That expresses the behavior directly instead of forcing a boolean to carry multiple meanings.

## Release-lane expectation

- Stable guidance is preserved under `3.x`
- Unreleased API and behavior shifts land in `Next`

When `v4` starts diverging materially, that work should stay in `Next` until the release is real enough to freeze.
