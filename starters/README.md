# v4 alpha starters

These are small, independent consumer apps for Screen Transitions v4. They share the same detail, snap-sheet, and remote-media zoom flows while exercising the two navigation hosts separately.

| Starter | Navigation host | Integration |
| --- | --- | --- |
| [`expo-router`](expo-router) | Expo Router on Expo SDK 56 | `BlankStack` from `react-native-screen-transitions/expo-router` |
| [`react-navigation`](react-navigation) | Upstream React Navigation in an Expo SDK 56 app | `createBlankStackNavigator()` from `react-native-screen-transitions/react-navigation` |

Both apps follow stock Expo SDK 56 templates. They do not rely on monorepo aliases, custom Metro resolution, a local navigator wrapper, or generated-file edits. You can start from another compatible Expo template, install the same navigation host and Screen Transitions dependencies, and use the example code unchanged.

Each directory has its own dependencies so it exercises the published alpha package as a real application would. The starters are not part of the repository's Bun workspace.
