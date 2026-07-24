import { SafeAreaProviderCompat } from "@react-navigation/elements";
import { memo, type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
	children: ReactNode;
}

export interface StackCoreContextValue {
	flags: {
		TRANSITIONS_ALWAYS_ON: boolean;
		STACK_TYPE?: StackType;
		DISABLE_NATIVE_SCREENS: boolean;
		DISABLE_NATIVE_SCREEN_CONTAINER: boolean;
	};
}

const StackCoreRoot = memo(function StackCoreRoot({
	children,
	stackType,
}: {
	children: ReactNode;
	stackType: StackType;
}) {
	return (
		<GestureHandlerRootView
			style={styles.container}
			pointerEvents={stackType === StackType.COMPONENT ? "box-none" : undefined}
		>
			<SafeAreaProviderCompat>{children}</SafeAreaProviderCompat>
		</GestureHandlerRootView>
	);
});

export const { StackCoreProvider, useStackCoreStore } = createProvider(
	"StackCore",
	{ guarded: true },
)<StackCoreProviderProps, StackCoreContextValue>(({ config, children }) => {
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
		children: <StackCoreRoot stackType={STACK_TYPE}>{children}</StackCoreRoot>,
	};
});

const styles = StyleSheet.create({
	container: { flex: 1 },
});
