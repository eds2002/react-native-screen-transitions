import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { Layout } from "../types/screen.types";
import { createStore } from "../utils/create-store";

export enum LifecycleTransitionRequestKind {
	None = 0,
	Open = 1,
	ManagedClose = 2,
	NativeClose = 3,
}

type SystemStoreState = {
	targetProgress: SharedValue<number>;

	/**
	 * Resolved fraction (contentHeight / screenHeight) for the 'auto' snap point. -1 = not yet measured.
	 */
	resolvedAutoSnapPoint: SharedValue<number>;

	/**
	 * Intrinsic measured content layout from the screen container wrapper.
	 */
	measuredContentLayout: SharedValue<Layout | null>;

	/**
	 * Monotonic lifecycle request id so repeated requests still trigger reactions.
	 */
	pendingLifecycleRequestId: SharedValue<number>;

	/**
	 * The currently pending lifecycle transition request.
	 */
	pendingLifecycleRequestKind: SharedValue<LifecycleTransitionRequestKind>;

	/**
	 * Progress target for the pending lifecycle transition request.
	 */
	pendingLifecycleRequestTarget: SharedValue<number>;
};

export interface SystemStoreHelpers {
	requestLifecycleTransition(
		kind: LifecycleTransitionRequestKind,
		target: number,
	): void;
	clearLifecycleTransitionRequest(requestId: number): void;
}

export type SystemStoreMap = SystemStoreState & SystemStoreHelpers;

/**
 * Route-keyed internal engine state that should not be treated as public screen
 * animation data. These values support runtime measurement and orchestration,
 * such as resolved auto snap points, measured content layout, and the current
 * animation target progress. This could possibly grow in the future.
 */
export const SystemStore = createStore<SystemStoreState, SystemStoreHelpers>({
	createBag: () => ({
		targetProgress: makeMutable(1),
		resolvedAutoSnapPoint: makeMutable(-1),
		measuredContentLayout: makeMutable<Layout | null>(null),
		pendingLifecycleRequestId: makeMutable<number>(0),
		pendingLifecycleRequestKind: makeMutable<LifecycleTransitionRequestKind>(
			LifecycleTransitionRequestKind.None,
		),
		pendingLifecycleRequestTarget: makeMutable<number>(0),
	}),
	disposeBag: (bag) => {
		cancelAnimation(bag.targetProgress);
		cancelAnimation(bag.resolvedAutoSnapPoint);
		cancelAnimation(bag.measuredContentLayout);
		cancelAnimation(bag.pendingLifecycleRequestId);
		cancelAnimation(bag.pendingLifecycleRequestKind);
		cancelAnimation(bag.pendingLifecycleRequestTarget);
	},
	helpers: (bag) => ({
		requestLifecycleTransition(kind, target) {
			"worklet";
			bag.pendingLifecycleRequestTarget.set(target);
			bag.pendingLifecycleRequestKind.set(kind);
			bag.pendingLifecycleRequestId.set(
				bag.pendingLifecycleRequestId.get() + 1,
			);
		},

		clearLifecycleTransitionRequest(requestId) {
			"worklet";
			if (bag.pendingLifecycleRequestId.get() !== requestId) {
				return;
			}

			bag.pendingLifecycleRequestKind.set(LifecycleTransitionRequestKind.None);
			bag.pendingLifecycleRequestTarget.set(0);
		},
	}),
});
