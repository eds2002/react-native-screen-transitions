# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.2](https://github.com/eds2002/react-native-screen-transitions/compare/expo-router-example@2.0.1...expo-router-example@2.0.2) (2025-08-12)

**Note:** Version bump only for package expo-router-example

## [2.0.1](https://github.com/eds2002/react-native-screen-transitions/compare/expo-router-example@2.0.0...expo-router-example@2.0.1) (2025-08-12)

**Note:** Version bump only for package expo-router-example

# 2.0.0 (2025-08-11)

### Bug Fixes

* Bug fix in create scrollable causing duplication of screen animations ([a2448e7](https://github.com/eds2002/react-native-screen-transitions/commit/a2448e722536623811c2d120f2c72bb3767ff474))
* Fix presets not defining timing config ( default timing config is removed ) ([627a765](https://github.com/eds2002/react-native-screen-transitions/commit/627a76530724c5e43fc7b6c92e84ee4f16aefee9))
* Fix Scrollables inside transitional views that have matching gestures. ([2a3e6fc](https://github.com/eds2002/react-native-screen-transitions/commit/2a3e6fc63b663e6d38daede4f4ee2322e1db7f88))
* prevent gesture reactivation during screen dismiss animation + examples  + refactors ([2cdff32](https://github.com/eds2002/react-native-screen-transitions/commit/2cdff32ec6f0638443b1f0e553d1c7c010093bae))
* prevent on layout measures from running multiple times causing inaccurate measurements ([20d53a5](https://github.com/eds2002/react-native-screen-transitions/commit/20d53a5fcfb2d4b2827e787169e26642837476eb))
* Remeasure on press, and check if applicable to measure onLayout. Allow users to set the x and y for shared bounds. Create new bound builder to align the bound screen with the previous bound. ([90a77dd](https://github.com/eds2002/react-native-screen-transitions/commit/90a77dddc4a780a98714c87d63556ecb7c3338f1))
* Set onlayout for scrollables, this fixes the issue where you have to scroll multiple times when setting vertical-inverted. ([45029c2](https://github.com/eds2002/react-native-screen-transitions/commit/45029c270c55c46f44179ecdeab307c8d5fd4a6a))

### Features

* create helpful bound utilities to simplify shared bound animations ([276f5dc](https://github.com/eds2002/react-native-screen-transitions/commit/276f5dc33536fb6e74b95b3800698028637d0ab4))
* Expand on existing example, allow users to get bounds if needed, pass route metadata for more customization via useScreenAnimation hook ([01326a0](https://github.com/eds2002/react-native-screen-transitions/commit/01326a09e97c44719199cd919fcb804122546dd9))
* Integrate ability to disable gesture driving progress via gestureDrivesProgress, ([df8d7be](https://github.com/eds2002/react-native-screen-transitions/commit/df8d7be0408b99d52db050fdd2f9c7ac39030038))
* integrate working example of shared bounds. ([5ef22ee](https://github.com/eds2002/react-native-screen-transitions/commit/5ef22eeb577ca56f480ab15ac58ee4e3c66d3dba))
* new basic examples ([d1b619d](https://github.com/eds2002/react-native-screen-transitions/commit/d1b619d5a96cab44099155f0dc3e1b96ca6b5b9a))
* new navigator ([4f3bb3c](https://github.com/eds2002/react-native-screen-transitions/commit/4f3bb3ce8b9bef2193a602154e59a54ec33c497f))
* Start ability to decide of gesture should drive the progress. ([5179038](https://github.com/eds2002/react-native-screen-transitions/commit/5179038ec348efc8a20a979e97a01413ac39349f))
