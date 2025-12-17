import { SafeAreaProviderCompat } from "@react-navigation/elements";
import * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

	const value = React.useMemo(
		() => ({
			flags: { TRANSITIONS_ALWAYS_ON },
			routeKeys,
			props: innerProps,
		}),
		[TRANSITIONS_ALWAYS_ON, routeKeys, innerProps],
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
