import { SafeAreaProviderCompat } from "@react-navigation/elements";
import type * as React from "react";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StackType } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";

export interface StackCoreConfig {
	TRANSITIONS_ALWAYS_ON?: boolean;
	STACK_TYPE?: StackType;
}

interface StackCoreProviderProps {
	config: StackCoreConfig;
	children: React.ReactNode;
}

export interface StackCoreContextValue {
	flags: {
		TRANSITIONS_ALWAYS_ON: boolean;
		STACK_TYPE?: StackType;
	};
}

const { StackCoreProvider: InternalStackCoreProvider, useStackCoreContext } =
	createProvider("StackCore", { guarded: true })<
		StackCoreProviderProps,
		StackCoreContextValue
	>(({ config, children }) => {
		const { TRANSITIONS_ALWAYS_ON = false, STACK_TYPE = StackType.BLANK } =
			config;

		const flags = useMemo(
			() => ({
				TRANSITIONS_ALWAYS_ON,
				STACK_TYPE,
			}),
			[TRANSITIONS_ALWAYS_ON, STACK_TYPE],
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
		TRANSITIONS_ALWAYS_ON,
		STACK_TYPE,
		...props
	}: TProps & StackCoreConfig) {
		// Start from defaults, then apply explicit overrides from the caller.
		const config: StackCoreConfig = {
			TRANSITIONS_ALWAYS_ON:
				TRANSITIONS_ALWAYS_ON ?? defaultConfig.TRANSITIONS_ALWAYS_ON,
			STACK_TYPE: STACK_TYPE ?? defaultConfig.STACK_TYPE,
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
