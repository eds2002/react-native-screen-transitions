import { SafeAreaProviderCompat } from "@react-navigation/elements";
import * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { StackType } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";

interface StackCoreConfig {
	TRANSITIONS_ALWAYS_ON?: boolean;
	TYPE?: StackType;
}

interface StackCoreProviderProps {
	config: StackCoreConfig;
	children: React.ReactNode;
}

interface StackCoreContextValue {
	flags: {
		TRANSITIONS_ALWAYS_ON: boolean;
		TYPE?: StackType;
	};
}

const { StackCoreProvider: InternalStackCoreProvider } = createProvider(
	"StackCore",
	{ guarded: true },
)<StackCoreProviderProps, StackCoreContextValue>(({ config, children }) => {
	const { TRANSITIONS_ALWAYS_ON = false, ...rest } = config;

	const value = React.useMemo(
		() => ({
			flags: { TRANSITIONS_ALWAYS_ON, TYPE: rest.TYPE },
		}),
		[TRANSITIONS_ALWAYS_ON, rest.TYPE],
	);

	return {
		value,
		children: (
			<GestureHandlerRootView style={styles.container}>
				<SafeAreaProviderCompat>{children}</SafeAreaProviderCompat>
			</GestureHandlerRootView>
		),
	};
});

/**
 * HOC that wraps a component with the StackCore provider.
 * Just a simple open gate
 */
export function withStackCore<TProps extends object>(
	config: StackCoreConfig,
	Component: React.ComponentType<TProps>,
): React.FC<TProps> {
	return function StackCoreWrapper(props: TProps) {
		return (
			<InternalStackCoreProvider config={config}>
				<Component {...props} />
			</InternalStackCoreProvider>
		);
	};
}

const styles = StyleSheet.create({
	container: { flex: 1 },
});
