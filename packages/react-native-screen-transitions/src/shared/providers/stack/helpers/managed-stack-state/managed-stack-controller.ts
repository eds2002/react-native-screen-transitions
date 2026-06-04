import { StackActions } from "@react-navigation/native";
import type { ManagedStackProps } from "../../../../types/providers/managed-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
} from "../../../../types/stack.types";
import { buildManagedStackState } from "./helpers/build-managed-stack-state";
import { deriveManagedStackState } from "./helpers/derive-managed-stack-state";
import type {
	ManagedDescriptorSources,
	ManagedStackControllerSnapshot,
	ManagedStackController as ManagedStackControllerType,
} from "./helpers/types";

export type { ManagedStackController } from "./helpers/types";

/**
 * Maintains the stack-local route snapshot used while managed transitions run.
 *
 * React Navigation remains the source of truth for settled routes, but it can
 * remove descriptors before our close animation has finished. This controller
 * keeps those closing routes locally until their lifecycle reports completion.
 */
export const createManagedStackController = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	initialProps: ManagedStackProps<TDescriptor, TNavigation>,
): ManagedStackControllerType<TDescriptor, TNavigation> => {
	const closingRouteKeys = new Set<string>();
	let props = initialProps;
	let previousRoutesSnapshot = initialProps.state.routes;
	let snapshot: ManagedStackControllerSnapshot<TDescriptor> = {
		state: buildManagedStackState({
			props,
			routes: initialProps.state.routes,
			descriptors:
				initialProps.descriptors as ManagedDescriptorSources<TDescriptor>,
			closingRouteKeys,
		}),
	};
	const listeners = new Set<() => void>();

	const emit = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	const subscribe = (listener: () => void) => {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	};

	const getSnapshot = (): ManagedStackControllerSnapshot<TDescriptor> => {
		return snapshot;
	};

	const update = (nextProps: ManagedStackProps<TDescriptor, TNavigation>) => {
		const lastRoutesSnapshot = previousRoutesSnapshot;
		props = nextProps;

		const nextState = deriveManagedStackState({
			props,
			current: snapshot.state,
			previousRoutesSnapshot: lastRoutesSnapshot,
			closingRouteKeys,
		});
		previousRoutesSnapshot = nextProps.state.routes;

		if (nextState === snapshot.state) {
			return;
		}

		snapshot = {
			state: nextState,
		};
	};

	const handleCloseRoute = ({ route }: { route: BaseStackRoute }) => {
		const { state, navigation } = props;

		if (state.routes.some((candidate) => candidate.key === route.key)) {
			navigation.dispatch({
				...StackActions.pop(),
				source: route.key,
				target: state.key,
			});
			return;
		}

		closingRouteKeys.delete(route.key);

		const current = snapshot.state;
		const routeExists = current.routes.some(
			(candidate) => candidate.key === route.key,
		);

		if (!routeExists) {
			return;
		}

		const nextRoutes = current.routes.filter(
			(candidate) => candidate.key !== route.key,
		);

		const nextDescriptors = { ...current.sourceDescriptors };
		delete nextDescriptors[route.key];

		snapshot = {
			state: buildManagedStackState({
				props,
				routes: nextRoutes,
				descriptors: nextDescriptors,
				closingRouteKeys,
				previousState: current,
			}),
		};
		emit();
	};

	const requestDismiss = ({ route }: { route: BaseStackRoute }): boolean => {
		const current = snapshot.state;
		const routeIndex = current.routes.findIndex(
			(candidate) => candidate.key === route.key,
		);

		if (routeIndex <= 0) {
			return false;
		}

		if (closingRouteKeys.has(route.key)) {
			return true;
		}

		closingRouteKeys.add(route.key);
		snapshot = {
			state: buildManagedStackState({
				props,
				routes: current.routes,
				descriptors: current.sourceDescriptors,
				closingRouteKeys,
				previousState: current,
			}),
		};
		emit();
		return true;
	};

	return {
		subscribe,
		getSnapshot,
		update,
		handleCloseRoute,
		requestDismiss,
	};
};
