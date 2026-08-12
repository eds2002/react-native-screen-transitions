# v3 starters

These are small, independent consumer apps for the stable Screen Transitions v3 release. They intentionally use the v3 package entry points and share the same detail, snap-sheet, and remote-media zoom flows.

| Starter | Navigation host | Integration |
| --- | --- | --- |
| [`expo-router`](expo-router) | Expo Router on Expo SDK 55 | `createBlankStackNavigator()` wrapped with `withLayoutContext()` |
| [`react-navigation`](react-navigation) | Upstream React Navigation in an Expo SDK 55 app | `createBlankStackNavigator()` inside `NavigationContainer` |

The starters and the repository's v3 e2e app use SDK 55, the final Expo Router release backed by external React Navigation packages. Expo Router forks those packages in SDK 56, so SDK 56+ Expo Router projects need the separate v4 alpha integration.

Each directory has its own dependencies so it exercises the published package as a real application would. It is not part of the repository's Bun workspace.
