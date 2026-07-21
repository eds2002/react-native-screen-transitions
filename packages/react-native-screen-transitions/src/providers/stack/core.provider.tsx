import * as React from "react";
import { useMemo } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
	initialWindowMetrics,
	SafeAreaInsetsContext,
	SafeAreaProvider,
} from "react-native-safe-area-context";
import { StackType } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";

export interface StackCoreConfig {
	TRANSITIONS_ALWAYS_ON?: boolean;
	STACK_TYPE?: StackType;
	DISABLE_NATIVE_SCREENS?: boolean;
	DISABLE_NATIVE_SCREEN_CONTAINER?: boolean;
}

interface StackCoreProviderProps {
	config: StackCoreConfig;
	children: React.ReactNode;
}

export interface StackCoreContextValue {
	flags: {
		TRANSITIONS_ALWAYS_ON: boolean;
		STACK_TYPE?: StackType;
		DISABLE_NATIVE_SCREENS: boolean;
		DISABLE_NATIVE_SCREEN_CONTAINER: boolean;
	};
}

const { width = 0, height = 0 } = Dimensions.get("window");

const initialSafeAreaMetrics =
	Platform.OS === "web" || initialWindowMetrics == null
		? {
				frame: { x: 0, y: 0, width, height },
				insets: { top: 0, left: 0, right: 0, bottom: 0 },
			}
		: initialWindowMetrics;

function StackSafeAreaProvider({ children }: { children: React.ReactNode }) {
	const insets = React.useContext(SafeAreaInsetsContext);

	if (insets) {
		return <View style={styles.container}>{children}</View>;
	}

	return (
		<SafeAreaProvider
			initialMetrics={initialSafeAreaMetrics}
			style={styles.container}
		>
			{children}
		</SafeAreaProvider>
	);
}

const { StackCoreProvider: InternalStackCoreProvider, useStackCoreContext } =
	createProvider("StackCore", { guarded: true })<
		StackCoreProviderProps,
		StackCoreContextValue
	>(({ config, children }) => {
		const {
			TRANSITIONS_ALWAYS_ON = false,
			DISABLE_NATIVE_SCREENS = false,
			DISABLE_NATIVE_SCREEN_CONTAINER = false,
			STACK_TYPE = StackType.BLANK,
		} = config;

		const flags = useMemo(
			() => ({
				TRANSITIONS_ALWAYS_ON,
				STACK_TYPE,
				DISABLE_NATIVE_SCREENS,
				DISABLE_NATIVE_SCREEN_CONTAINER,
			}),
			[
				TRANSITIONS_ALWAYS_ON,
				STACK_TYPE,
				DISABLE_NATIVE_SCREENS,
				DISABLE_NATIVE_SCREEN_CONTAINER,
			],
		);

		return {
			value: { flags },
			children: (
				<GestureHandlerRootView
					style={styles.container}
					pointerEvents={
						STACK_TYPE === StackType.COMPONENT ? "box-none" : undefined
					}
				>
					<StackSafeAreaProvider>{children}</StackSafeAreaProvider>
				</GestureHandlerRootView>
			),
		};
	});

/**
 * HOC that wraps a component with the StackCore provider.
 * Just a simple open gate
 */
export function withStackCore<TProps extends object>(
	defaultConfig: StackCoreConfig,
	Component: React.ComponentType<TProps>,
): React.FC<TProps & StackCoreConfig> {
	return function StackCoreWrapper({
		DISABLE_NATIVE_SCREENS,
		DISABLE_NATIVE_SCREEN_CONTAINER,
		TRANSITIONS_ALWAYS_ON,
		STACK_TYPE,
		...props
	}: TProps & StackCoreConfig) {
		// Start from defaults, then apply explicit overrides from the caller.
		const config: StackCoreConfig = {
			TRANSITIONS_ALWAYS_ON:
				TRANSITIONS_ALWAYS_ON ?? defaultConfig.TRANSITIONS_ALWAYS_ON,
			STACK_TYPE: STACK_TYPE ?? defaultConfig.STACK_TYPE,
			DISABLE_NATIVE_SCREENS:
				DISABLE_NATIVE_SCREENS ?? defaultConfig.DISABLE_NATIVE_SCREENS,
			DISABLE_NATIVE_SCREEN_CONTAINER:
				DISABLE_NATIVE_SCREEN_CONTAINER ??
				defaultConfig.DISABLE_NATIVE_SCREEN_CONTAINER,
		};
		return (
			<InternalStackCoreProvider config={config}>
				<Component {...(props as TProps)} />
			</InternalStackCoreProvider>
		);
	};
}

const styles = StyleSheet.create({
	container: { flex: 1 },
});

export { useStackCoreContext };
