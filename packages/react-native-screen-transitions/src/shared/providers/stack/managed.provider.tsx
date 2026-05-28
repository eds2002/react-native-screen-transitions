import * as React from "react";
import { useMemo } from "react";
import {
	type StackContextValue,
	StackProvider,
} from "../../hooks/navigation/use-stack";
import type {
	ManagedStackContextValue,
	ManagedStackProps,
	ManagedStackRenderProps,
	ManagedStackResult,
} from "../../types/providers/managed-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
} from "../../types/stack.types";
import { useManagedStackState } from "./helpers/managed-stack-state";

const ManagedStackContext =
	React.createContext<ManagedStackContextValue | null>(null);
ManagedStackContext.displayName = "ManagedStack";

function useManagedStackContext(): ManagedStackContextValue {
	const context = React.useContext(ManagedStackContext);
	if (!context) {
		throw new Error(
			"useManagedStackContext must be used within ManagedStackProvider",
		);
	}
	return context;
}

function useManagedStackValue<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: ManagedStackProps<TDescriptor, TNavigation>,
): ManagedStackResult<TDescriptor> {
	const { state, handleCloseRoute, requestDismiss } =
		useManagedStackState(props);

	const navigatorKey = props.state.key;
	const focusedIndex = props.state.index;

	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			navigatorKey,
			routeKeys: state.routeKeys,
			routes: state.routes,
			scenes: state.scenes,
			focusedIndex,
			requestDismiss,
		}),
		[
			navigatorKey,
			state.routeKeys,
			state.routes,
			state.scenes,
			focusedIndex,
			requestDismiss,
		],
	);

	const managedContextValue = useMemo<ManagedStackContextValue>(
		() => ({
			handleCloseRoute,
		}),
		[handleCloseRoute],
	);

	const renderProps = useMemo<ManagedStackRenderProps<TDescriptor>>(
		() => ({
			scenes: state.scenes,
			focusedIndex,
			shouldShowFloatOverlay: state.shouldShowFloatOverlay,
		}),
		[state.scenes, focusedIndex, state.shouldShowFloatOverlay],
	);

	return { stackContextValue, managedContextValue, renderProps };
}

function withManagedStack<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
>(
	Component: React.ComponentType<ManagedStackRenderProps<TDescriptor>>,
): React.FC<ManagedStackProps<TDescriptor, TNavigation>> {
	return function ManagedStackProvider(
		props: ManagedStackProps<TDescriptor, TNavigation>,
	) {
		const { stackContextValue, managedContextValue, renderProps } =
			useManagedStackValue<TDescriptor, TNavigation>(props);

		return (
			<StackProvider value={stackContextValue}>
				<ManagedStackContext.Provider value={managedContextValue}>
					<Component {...renderProps} />
				</ManagedStackContext.Provider>
			</StackProvider>
		);
	};
}

export { useManagedStackContext, withManagedStack };
