import {
	type ComponentType,
	type FC,
	memo,
	type ReactNode,
	useContext,
	useMemo,
} from "react";
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

const { width = 0, height = 0 } = Dimensions.get("window");

const initialSafeAreaMetrics =
	Platform.OS === "web" || initialWindowMetrics == null
		? {
				frame: { x: 0, y: 0, width, height },
				insets: { top: 0, left: 0, right: 0, bottom: 0 },
			}
		: initialWindowMetrics;

const StackSafeAreaProvider = memo(function StackSafeAreaProvider({
	children,
}: {
	children: ReactNode;
}) {
	const insets = useContext(SafeAreaInsetsContext);

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
});

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
			<StackSafeAreaProvider>{children}</StackSafeAreaProvider>
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

export function withStackCore<TProps extends object>(
	defaultConfig: StackCoreConfig,
	Component: ComponentType<TProps>,
): FC<TProps & StackCoreConfig> {
	return function StackCoreWrapper({
		DISABLE_NATIVE_SCREENS,
		DISABLE_NATIVE_SCREEN_CONTAINER,
		TRANSITIONS_ALWAYS_ON,
		STACK_TYPE,
		...props
	}: TProps & StackCoreConfig) {
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
			<StackCoreProvider config={config}>
				<Component {...(props as TProps)} />
			</StackCoreProvider>
		);
	};
}

const styles = StyleSheet.create({
	container: { flex: 1 },
});
