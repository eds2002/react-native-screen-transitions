import { useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import type { Layout } from "../../../types/screen.types";

export enum LifecycleTransitionRequestKind {
	None = 0,
	Open = 1,
	Close = 2,
}

type MotionTransitionRawValues = {
	targetProgress: SharedValue<number>;

	/**
	 * Directional linear clock for the active progress animation. Increasing
	 * animations run 0 -> 1; decreasing animations run 1 -> 0.
	 */
	animationProgress: SharedValue<number>;

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
	 * Number of active blockers preventing a pending lifecycle request from
	 * starting immediately.
	 */
	pendingLifecycleStartBlockCount: SharedValue<number>;

	/**
	 * 1 while the first measurement of an `'auto'` (or named) snap point may open the screen.
	 * Screens open when they mount, so this starts armed; a unit that mounts closed disarms it
	 * until it is asked to open.
	 */
	autoOpenArmed: SharedValue<number>;
};

export interface MotionTransitionActions {
	requestLifecycleTransition(
		kind: LifecycleTransitionRequestKind,
		target: number,
	): void;
	clearLifecycleTransitionRequest(): void;
	blockLifecycleStart(): void;
	unblockLifecycleStart(): void;
	drainLifecycleStartBlocks(): void;
}

export type MotionTransitionValues = MotionTransitionRawValues & {
	actions: MotionTransitionActions;
};

export function useTransitionValues(): MotionTransitionValues {
	const targetProgress = useSharedValue(1);
	const animationProgress = useSharedValue(0);
	const resolvedAutoSnapPoint = useSharedValue(-1);
	const measuredContentLayout = useSharedValue<Layout | null>(null);
	const pendingLifecycleRequestKind = useSharedValue(
		LifecycleTransitionRequestKind.None,
	);
	const pendingLifecycleRequestTarget = useSharedValue(0);
	const pendingLifecycleStartBlockCount = useSharedValue(0);
	const autoOpenArmed = useSharedValue(1);

	return useMemo(() => {
		const bag = {
			targetProgress,
			animationProgress,
			resolvedAutoSnapPoint,
			measuredContentLayout,
			pendingLifecycleRequestKind,
			pendingLifecycleRequestTarget,
			pendingLifecycleStartBlockCount,
			autoOpenArmed,
		};

		return {
			...bag,
			actions: {
				requestLifecycleTransition(kind, target) {
					"worklet";
					bag.pendingLifecycleRequestTarget.set(target);
					bag.pendingLifecycleRequestKind.set(kind);
				},

				clearLifecycleTransitionRequest() {
					"worklet";
					bag.pendingLifecycleRequestKind.set(
						LifecycleTransitionRequestKind.None,
					);
					bag.pendingLifecycleRequestTarget.set(0);
				},

				blockLifecycleStart() {
					"worklet";
					bag.pendingLifecycleStartBlockCount.modify(
						<T extends number>(count: T): T => {
							"worklet";
							return (count + 1) as T;
						},
					);
				},

				unblockLifecycleStart() {
					"worklet";
					bag.pendingLifecycleStartBlockCount.modify(
						<T extends number>(count: T): T => {
							"worklet";
							return Math.max(0, count - 1) as T;
						},
					);
				},

				drainLifecycleStartBlocks() {
					"worklet";
					bag.pendingLifecycleStartBlockCount.set(0);
				},
			},
		};
	}, [
		targetProgress,
		animationProgress,
		resolvedAutoSnapPoint,
		measuredContentLayout,
		pendingLifecycleRequestKind,
		pendingLifecycleRequestTarget,
		pendingLifecycleStartBlockCount,
		autoOpenArmed,
	]);
}
