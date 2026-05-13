import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import { LOGICAL_SETTLE_REQUIRED_FRAMES } from "../constants";
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
	 * The currently pending lifecycle transition request.
	 */
	pendingLifecycleRequestKind: SharedValue<LifecycleTransitionRequestKind>;

	/**
	 * Progress target for the pending lifecycle transition request.
	 */
	pendingLifecycleRequestTarget: SharedValue<number>;

	/**
	 * Number of consecutive frames progress has stayed near its target.
	 */
	logicalSettleFrameCount: SharedValue<number>;

	/**
	 * Number of active blockers preventing a pending lifecycle request from
	 * starting immediately.
	 */
	pendingLifecycleStartBlockCount: SharedValue<number>;
};

export interface SystemStoreActions {
	requestLifecycleTransition(
		kind: LifecycleTransitionRequestKind,
		target: number,
	): void;
	clearLifecycleTransitionRequest(): void;
	blockLifecycleStart(): void;
	unblockLifecycleStart(): void;
}

export type SystemStoreMap = SystemStoreState & {
	actions: SystemStoreActions;
};

/**
 * Route-keyed internal engine state that should not be treated as public screen
 * animation data. These values support runtime measurement and orchestration,
 * such as resolved auto snap points, measured content layout, and the current
 * animation target progress. This could possibly grow in the future.
 */
export const SystemStore = createStore<SystemStoreState, SystemStoreActions>({
	createBag: () => ({
		targetProgress: makeMutable(1),
		resolvedAutoSnapPoint: makeMutable(-1),
		measuredContentLayout: makeMutable<Layout | null>(null),
		pendingLifecycleRequestKind: makeMutable<LifecycleTransitionRequestKind>(
			LifecycleTransitionRequestKind.None,
		),
		pendingLifecycleRequestTarget: makeMutable<number>(0),
		logicalSettleFrameCount: makeMutable(LOGICAL_SETTLE_REQUIRED_FRAMES),
		pendingLifecycleStartBlockCount: makeMutable<number>(0),
	}),
	disposeBag: (bag) => {
		cancelAnimation(bag.targetProgress);
		cancelAnimation(bag.resolvedAutoSnapPoint);
		cancelAnimation(bag.measuredContentLayout);
		cancelAnimation(bag.pendingLifecycleRequestKind);
		cancelAnimation(bag.pendingLifecycleRequestTarget);
		cancelAnimation(bag.logicalSettleFrameCount);
		cancelAnimation(bag.pendingLifecycleStartBlockCount);
	},
	actions: (bag) => ({
		requestLifecycleTransition(kind, target) {
			"worklet";
			bag.pendingLifecycleRequestTarget.set(target);
			bag.pendingLifecycleRequestKind.set(kind);
		},

		clearLifecycleTransitionRequest() {
			"worklet";
			bag.pendingLifecycleRequestKind.set(LifecycleTransitionRequestKind.None);
			bag.pendingLifecycleRequestTarget.set(0);
		},

		blockLifecycleStart() {
			"worklet";
			bag.pendingLifecycleStartBlockCount.set(
				bag.pendingLifecycleStartBlockCount.get() + 1,
			);
		},

		unblockLifecycleStart() {
			"worklet";
			bag.pendingLifecycleStartBlockCount.set(
				Math.max(0, bag.pendingLifecycleStartBlockCount.get() - 1),
			);
		},
	}),
});
