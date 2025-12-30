import { SafeAreaProviderCompat } from "@react-navigation/elements";
import type * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StackType } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";

export interface StackCoreConfig {
	TRANSITIONS_ALWAYS_ON?: boolean;
	STACK_TYPE?: StackType;
	DISABLE_NATIVE_SCREENS?: boolean;
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
	};
}

const { StackCoreProvider: InternalStackCoreProvider, useStackCoreContext } =
	createProvider("StackCore", { guarded: true })<
		StackCoreProviderProps,
		StackCoreContextValue
	>(({ config, children }) => {
		const {
			TRANSITIONS_ALWAYS_ON = false,
			DISABLE_NATIVE_SCREENS = false,
			STACK_TYPE = StackType.BLANK,
		} = config;

		return {
			value: {
				flags: {
					TRANSITIONS_ALWAYS_ON,
					STACK_TYPE,
					DISABLE_NATIVE_SCREENS,
				},
			},
			children: (
				<GestureHandlerRootView
					style={styles.container}
					pointerEvents={
						STACK_TYPE === StackType.COMPONENT ? "box-none" : undefined
					}
				>
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
	defaultConfig: StackCoreConfig,
	Component: React.ComponentType<TProps>,
): React.FC<TProps & StackCoreConfig> {
	return function StackCoreWrapper({
		DISABLE_NATIVE_SCREENS,
		TRANSITIONS_ALWAYS_ON,
		STACK_TYPE,
		...props
	}: TProps & StackCoreConfig) {
		// User props first, then defaultConfig overrides (config takes priority)
		const config: StackCoreConfig = {
			...(DISABLE_NATIVE_SCREENS !== undefined && { DISABLE_NATIVE_SCREENS }),
			...(TRANSITIONS_ALWAYS_ON !== undefined && { TRANSITIONS_ALWAYS_ON }),
			...(STACK_TYPE !== undefined && { STACK_TYPE }),
			...defaultConfig,
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
