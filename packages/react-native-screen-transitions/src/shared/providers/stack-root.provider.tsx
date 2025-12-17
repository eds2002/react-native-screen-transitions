import { SafeAreaProviderCompat } from "@react-navigation/elements";
import * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { AnimationStore } from "../stores/animation.store";
import createProvider from "../utils/create-provider";

export interface StackRootConfig {
	TRANSITIONS_ALWAYS_ON?: boolean;
}

interface StackRootProviderProps {
	config: StackRootConfig;
	innerProps: unknown;
	children: React.ReactNode;
}

export interface StackRootContextValue<TProps = unknown> {
	flags: {
		TRANSITIONS_ALWAYS_ON: boolean;
	};
	routeKeys: string[];
	props: TProps;
	/**
	 * Aggregated stack progress across all routes.
	 * Sum of all individual screen progress values.
	 * When 4 screens are fully visible, stackProgress = 4.
	 */
	stackProgress: DerivedValue<number>;
	/**
	 * Focused index that accounts for closing screens.
	 * Returns currentIndex - 1 if any screen is closing, otherwise currentIndex.
	 */
	optimisticFocusedIndex: DerivedValue<number>;
}

interface PropsWithRoutes {
	state: {
		routes: Array<{ key: string }>;
	};
}

const {
	StackRootProvider: InternalStackRootProvider,
	useStackRootContext: internalUseStackRootContext,
} = createProvider("StackRoot", { guarded: true })<
	StackRootProviderProps,
	StackRootContextValue
>(({ config, innerProps, children }) => {
	const { TRANSITIONS_ALWAYS_ON = false } = config;

	const propsWithRoutes = innerProps as PropsWithRoutes | undefined;
	const routeKeys = React.useMemo(
		() => propsWithRoutes?.state?.routes?.map((r) => r.key) ?? [],
		[propsWithRoutes?.state?.routes],
	);

	// Get animation store maps for all routes (for use in DerivedValues)
	const animationMaps = React.useMemo(
		() => routeKeys.map((key) => AnimationStore.getAll(key)),
		[routeKeys],
	);

	// Aggregated stack progress: sum of all screen progress values
	const stackProgress = useDerivedValue(() => {
		"worklet";
		let total = 0;
		for (let i = 0; i < animationMaps.length; i++) {
			total += animationMaps[i].progress.value;
		}
		return total;
	}, [animationMaps]);

	// Optimistic focused index: accounts for closing screens
	const optimisticFocusedIndex = useDerivedValue(() => {
		"worklet";
		const currentIndex = animationMaps.length - 1;
		let isAnyClosing = false;
		for (let i = 0; i < animationMaps.length; i++) {
			if (animationMaps[i].closing.value > 0) {
				isAnyClosing = true;
				break;
			}
		}
		return currentIndex - (isAnyClosing ? 1 : 0);
	}, [animationMaps]);

	const value = React.useMemo(
		() => ({
			flags: { TRANSITIONS_ALWAYS_ON },
			routeKeys,
			props: innerProps,
			stackProgress,
			optimisticFocusedIndex,
		}),
		[
			TRANSITIONS_ALWAYS_ON,
			routeKeys,
			innerProps,
			stackProgress,
			optimisticFocusedIndex,
		],
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
 * HOC that wraps a component with the StackRoot provider.
 * Takes a config object as the first argument and the component as the second.
 *
 * @example
 * ```tsx
 * // Simple case
 * const MyStackView = withStackRootProvider(
 *   { TRANSITIONS_ALWAYS_ON: false },
 *   (props) => <StackContent {...props} />
 * );
 *
 * // With additional HOC (e.g., withStackNavigationProvider)
 * const MyStackView = withStackRootProvider(
 *   { TRANSITIONS_ALWAYS_ON: true },
 *   withStackNavigationProvider((transformedProps) => <StackContent {...transformedProps} />)
 * );
 * ```
 */
export function withStackRootProvider<TProps extends PropsWithRoutes>(
	config: StackRootConfig,
	Component: React.ComponentType<TProps>,
): React.FC<TProps> {
	return function StackRootWrapper(props: TProps) {
		return (
			<InternalStackRootProvider config={config} innerProps={props}>
				<Component {...props} />
			</InternalStackRootProvider>
		);
	};
}

/**
 * Hook to access the full StackRoot context.
 * Returns flags, routeKeys, and the original props.
 */
export function useStackRootContext<
	TProps = unknown,
>(): StackRootContextValue<TProps> {
	return internalUseStackRootContext() as StackRootContextValue<TProps>;
}

const styles = StyleSheet.create({
	container: { flex: 1 },
});
