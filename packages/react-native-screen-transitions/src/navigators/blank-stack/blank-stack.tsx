import { memo, type ReactNode, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
	SafeAreaInsetsContext,
	SafeAreaProvider,
} from "react-native-safe-area-context";
import { TransitionNavigator } from "../kit/transition-navigator";
import type { TransitionNavigatorProps } from "../kit/types";
import { useTransitionNavigator } from "../kit/use-transition-navigator";

/**
 * Provides safe-area insets only when nothing above does (like React Navigation's
 * SafeAreaProviderCompat). A provider measures insets from where it sits on screen, so a nested
 * stack with its own provider got new insets whenever an outer screen moved it (a drag, a
 * transition), a frame late: its content stayed pinned while the screen moved, then jumped.
 */
function SafeAreaProviderIfNeeded({ children }: { children: ReactNode }) {
	const insets = useContext(SafeAreaInsetsContext);
	if (insets) {
		return <View style={styles.container}>{children}</View>;
	}
	return <SafeAreaProvider>{children}</SafeAreaProvider>;
}

/** Blank Stack is the navigator kit with the standard layers: every scene drawn as its own layer. */
function BlankStackScenes(props: TransitionNavigatorProps) {
	const navigator = useTransitionNavigator(props);
	return <TransitionNavigator value={navigator} />;
}

export const BlankStack = memo(function BlankStack(
	props: TransitionNavigatorProps,
) {
	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaProviderIfNeeded>
				<BlankStackScenes {...props} />
			</SafeAreaProviderIfNeeded>
		</GestureHandlerRootView>
	);
});

const styles = StyleSheet.create({ container: { flex: 1 } });
