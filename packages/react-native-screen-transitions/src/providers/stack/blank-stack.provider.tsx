import type { Route } from "@react-navigation/native";
import * as React from "react";
import { useMemo } from "react";
import {
	type StackContextValue,
	StackProvider,
} from "../../hooks/navigation/use-stack";
import type {
	BlankStackProviderContextValue,
	BlankStackProviderProps,
	BlankStackProviderRenderProps,
	BlankStackProviderResult,
} from "../../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackScene,
} from "../../types/stack.types";
import { useBlankStackState } from "./blank-stack-state";
import { useStackCoreContext } from "./core.provider";

const BlankStackProviderContext =
	React.createContext<BlankStackProviderContextValue | null>(null);
BlankStackProviderContext.displayName = "BlankStackProvider";

function useBlankStackContext(): BlankStackProviderContextValue {
	const context = React.useContext(BlankStackProviderContext);
	if (!context) {
		throw new Error(
			"useBlankStackContext must be used within BlankStackProvider",
		);
	}
	return context;
}

function useBlankStackProviderValue<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: BlankStackProviderProps<TDescriptor, TNavigation>,
): BlankStackProviderResult<TDescriptor> {
	const { flags } = useStackCoreContext();
	const { state, handleCloseRoute, requestDismiss } = useBlankStackState(props);
	const navigatorKey = props.state.key;

	const focusedIndex = props.state.index;

	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			flags,
			navigatorKey,
			routeKeys: state.routeKeys,
			routes: state.routes as Route<string>[],
			scenes: state.scenes as BaseStackScene[],
			focusedIndex,
			requestDismiss,
		}),
		[
			flags,
			navigatorKey,
			state.routeKeys,
			state.routes,
			state.scenes,
			focusedIndex,
			requestDismiss,
		],
	);

	const blankStackProviderContextValue =
		useMemo<BlankStackProviderContextValue>(
			() => ({
				handleCloseRoute,
			}),
			[handleCloseRoute],
		);

	const renderProps = useMemo<BlankStackProviderRenderProps<TDescriptor>>(
		() => ({
			scenes: state.scenes,
			focusedIndex,
			shouldShowFloatOverlay: state.shouldShowFloatOverlay,
		}),
		[state.scenes, focusedIndex, state.shouldShowFloatOverlay],
	);

	return { stackContextValue, blankStackProviderContextValue, renderProps };
}

function withBlankStack<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
>(
	Component: React.ComponentType<BlankStackProviderRenderProps<TDescriptor>>,
): React.FC<BlankStackProviderProps<TDescriptor, TNavigation>> {
	return function BlankStackProvider(
		props: BlankStackProviderProps<TDescriptor, TNavigation>,
	) {
		const { stackContextValue, blankStackProviderContextValue, renderProps } =
			useBlankStackProviderValue<TDescriptor, TNavigation>(props);

		return (
			<StackProvider value={stackContextValue}>
				<BlankStackProviderContext.Provider
					value={blankStackProviderContextValue}
				>
					<Component {...renderProps} />
				</BlankStackProviderContext.Provider>
			</StackProvider>
		);
	};
}

export type {
	BlankStackProviderContextValue,
	BlankStackProviderProps,
	BlankStackProviderRenderProps,
};
export { useBlankStackContext, withBlankStack };
