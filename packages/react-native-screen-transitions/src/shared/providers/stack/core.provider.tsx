import { SafeAreaProviderCompat } from "@react-navigation/elements";
import type * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

/** Wraps a stack view with shared stack-level providers. */
export function withStackCore<TProps extends object>(
	Component: React.ComponentType<TProps>,
): React.FC<TProps> {
	return function StackCoreWrapper(props: TProps) {
		return (
			<GestureHandlerRootView style={styles.container}>
				<SafeAreaProviderCompat>
					<Component {...(props as TProps)} />
				</SafeAreaProviderCompat>
			</GestureHandlerRootView>
		);
	};
}

const styles = StyleSheet.create({
	container: { flex: 1 },
});
