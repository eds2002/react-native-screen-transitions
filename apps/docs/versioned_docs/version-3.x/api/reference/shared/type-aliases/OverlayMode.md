[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / OverlayMode

# ~~Type Alias: OverlayMode~~

> **OverlayMode** = `"float"` \| `"screen"`

Defined in: shared/types/overlay.types.ts:14

## Deprecated

Overlay mode is no longer needed. Overlays now always render as "float" mode.
For per-screen overlays, render an absolute-positioned view directly in your screen component
and use `useScreenAnimation()` to access animation values.
