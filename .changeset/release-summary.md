---
"react-native-screen-transitions": minor
---

## v3.2.0 Release Summary

### New Features
- `useScreenState()` hook - Access screen index, focused route, navigation state, and metadata
- `useHistory()` hook - Navigation history tracking with path queries
- Component Stack (Experimental) - Standalone navigator isolated from React Navigation, ideal for embedded flows
- Unified stack type system - Consistent APIs across Blank Stack, Native Stack, and Component Stack
- Overlay `progress` prop - Direct access to transition progress in overlay components
- `entering` animation state - New interpolation value for enter transitions

### Improvements  
- More accurate bounds measurements
- Better flickering handling during transitions
- Component Stack is fully separated from root navigation tree
- Touch-through events fixed in Component Stack

### Breaking Changes
- Deprecated `overlayMode` - Overlays are now float by default. For screen overlays, use a position absolute view instead.
- `screenAnimation` / `overlayAnimation` replaced by `screenStyleInterpolator`

### Fixes
- Navigation dismissal bug caused by lifecycle re-runs
- Isolated navigation state bug in Component Stack
- Removed dead code and unused types
