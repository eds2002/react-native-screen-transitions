# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.6](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.5...react-native-screen-transitions@2.0.6) (2025-08-21)

### Bug Fixes

* https://github.com/eds2002/react-native-screen-transitions/issues/7 ([#14](https://github.com/eds2002/react-native-screen-transitions/issues/14)) ([2b6aaa4](https://github.com/eds2002/react-native-screen-transitions/commit/2b6aaa4ae888c8e2bed6337127ebb7cb09793fc5))

## [2.0.5](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.3...react-native-screen-transitions@2.0.5) (2025-08-20)

### Bug Fixes

* correct import paths and whitespace issues ([#8](https://github.com/eds2002/react-native-screen-transitions/issues/8)) ([5a3a57e](https://github.com/eds2002/react-native-screen-transitions/commit/5a3a57eb983df3195e648f0a06129ee5743e49f3))

## [2.0.4](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.3...react-native-screen-transitions@2.0.4) (2025-08-20)

### Bug Fixes

* correct import paths and whitespace issues ([#8](https://github.com/eds2002/react-native-screen-transitions/issues/8)) ([5a3a57e](https://github.com/eds2002/react-native-screen-transitions/commit/5a3a57eb983df3195e648f0a06129ee5743e49f3))

## [2.0.3](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.2...react-native-screen-transitions@2.0.3) (2025-08-13)

**Note:** Version bump only for package react-native-screen-transitions

## [2.0.2](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.1...react-native-screen-transitions@2.0.2) (2025-08-12)

**Note:** Version bump only for package react-native-screen-transitions

## [2.0.1](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.0...react-native-screen-transitions@2.0.1) (2025-08-12)

### Bug Fixes

* **package:** correct main/module/types paths for npm build ([015d20d](https://github.com/eds2002/react-native-screen-transitions/commit/015d20d91a2f95efc377c764a2b1d9be12610b6f))

# 2.0.0 (2025-08-11)

### Bug Fixes

* Bug fix in create scrollable causing duplication of screen animations ([a2448e7](https://github.com/eds2002/react-native-screen-transitions/commit/a2448e722536623811c2d120f2c72bb3767ff474))
* Fix lingering transparent modals in nested stacks ([c365e37](https://github.com/eds2002/react-native-screen-transitions/commit/c365e37893aab00289d861a5ae0fc1195e621da7))
* Fix presets not defining timing config ( default timing config is removed ) ([627a765](https://github.com/eds2002/react-native-screen-transitions/commit/627a76530724c5e43fc7b6c92e84ee4f16aefee9))
* Fix Scrollables inside transitional views that have matching gestures. ([2a3e6fc](https://github.com/eds2002/react-native-screen-transitions/commit/2a3e6fc63b663e6d38daede4f4ee2322e1db7f88))
* prevent gesture reactivation during screen dismiss animation + examples  + refactors ([2cdff32](https://github.com/eds2002/react-native-screen-transitions/commit/2cdff32ec6f0638443b1f0e553d1c7c010093bae))
* prevent on layout measures from running multiple times causing inaccurate measurements ([20d53a5](https://github.com/eds2002/react-native-screen-transitions/commit/20d53a5fcfb2d4b2827e787169e26642837476eb))
* Readd manual activation for gesture to work ([f8f67a2](https://github.com/eds2002/react-native-screen-transitions/commit/f8f67a25ab0e7bd2c95121550cdfffac6935120f))
* Remeasure on press, and check if applicable to measure onLayout. Allow users to set the x and y for shared bounds. Create new bound builder to align the bound screen with the previous bound. ([90a77dd](https://github.com/eds2002/react-native-screen-transitions/commit/90a77dddc4a780a98714c87d63556ecb7c3338f1))
* respect gesture direction in progress mapping. ([3ef296f](https://github.com/eds2002/react-native-screen-transitions/commit/3ef296f252e63196b77a14a28c33fce3625f2903))
* Set onlayout for scrollables, this fixes the issue where you have to scroll multiple times when setting vertical-inverted. ([45029c2](https://github.com/eds2002/react-native-screen-transitions/commit/45029c270c55c46f44179ecdeab307c8d5fd4a6a))

### Features

* Add new store for bounds ( yet to actually include the measuring logic ) ([38195aa](https://github.com/eds2002/react-native-screen-transitions/commit/38195aaa674fbae28e008c6096317d931c74d862))
* Add new utils, prepare to convert most stores to utilzie the ui thread. ([4e9e160](https://github.com/eds2002/react-native-screen-transitions/commit/4e9e16069a1a2f3ca6ffce1c74deafcc7aaaf858))
* create helpful bound utilities to simplify shared bound animations ([276f5dc](https://github.com/eds2002/react-native-screen-transitions/commit/276f5dc33536fb6e74b95b3800698028637d0ab4))
* Expand on existing example, allow users to get bounds if needed, pass route metadata for more customization via useScreenAnimation hook ([01326a0](https://github.com/eds2002/react-native-screen-transitions/commit/01326a09e97c44719199cd919fcb804122546dd9))
* Integrate ability to disable gesture driving progress via gestureDrivesProgress, ([df8d7be](https://github.com/eds2002/react-native-screen-transitions/commit/df8d7be0408b99d52db050fdd2f9c7ac39030038))
* integrate working example of shared bounds. ([5ef22ee](https://github.com/eds2002/react-native-screen-transitions/commit/5ef22eeb577ca56f480ab15ac58ee4e3c66d3dba))
* new navigator ([4f3bb3c](https://github.com/eds2002/react-native-screen-transitions/commit/4f3bb3ce8b9bef2193a602154e59a54ec33c497f))
* Start ability to decide of gesture should drive the progress. ([5179038](https://github.com/eds2002/react-native-screen-transitions/commit/5179038ec348efc8a20a979e97a01413ac39349f))
