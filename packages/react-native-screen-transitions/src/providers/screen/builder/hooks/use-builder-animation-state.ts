import { useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import type { Layout } from "../../../../types/screen.types";

export enum LifecycleTransitionRequestKind {
	None = 0,
	Open = 1,
	Close = 2,
}

type BuilderAnimationValues = {
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
};

export interface BuilderAnimationActions {
	requestLifecycleTransition(
		kind: LifecycleTransitionRequestKind,
		target: number,
	): void;
	clearLifecycleTransitionRequest(): void;
	blockLifecycleStart(): void;
	unblockLifecycleStart(): void;
	drainLifecycleStartBlocks(): void;
}

export type BuilderAnimationState = BuilderAnimationValues & {
	actions: BuilderAnimationActions;
};

export function useBuilderAnimationState(): BuilderAnimationState {
	const targetProgress = useSharedValue(1);
	const animationProgress = useSharedValue(0);
	const resolvedAutoSnapPoint = useSharedValue(-1);
	const measuredContentLayout = useSharedValue<Layout | null>(null);
	const pendingLifecycleRequestKind = useSharedValue(
		LifecycleTransitionRequestKind.None,
	);
	const pendingLifecycleRequestTarget = useSharedValue(0);
	const pendingLifecycleStartBlockCount = useSharedValue(0);

	return useMemo(() => {
		const bag = {
			targetProgress,
			animationProgress,
			resolvedAutoSnapPoint,
			measuredContentLayout,
			pendingLifecycleRequestKind,
			pendingLifecycleRequestTarget,
			pendingLifecycleStartBlockCount,
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
	]);
}
