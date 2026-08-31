import { useCallback } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { allocateClipGestureReleaseIdOnUI } from "../../../providers/screen/clip/clip-stream-ui";
import { resolveSmoothClipNativeAnimation } from "../../../providers/screen/clips/coordinator/native-animation";
import {
	globalSmoothClipCoordinatorRuntime,
	INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
} from "../../../providers/screen/clips/coordinator/runtime-store";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	type SystemStoreMap,
} from "../../../stores/system.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";

export const useTransitionStartController = ({
	current,
	animations,
	system,
	onBlankStackCloseFinish,
	onNativeCloseFinish,
}: {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	system: SystemStoreMap;
	onBlankStackCloseFinish?: (finished: boolean) => void;
	onNativeCloseFinish?: (finished: boolean) => void;
}) => {
	const {
		targetProgress,
		pendingLifecycleRequestKind,
		pendingLifecycleRequestTarget,
		pendingLifecycleStartBlockCount,
	} = system;
	const { clearLifecycleTransitionRequest } = system.actions;
	const transitionSpec = current.options.transitionSpec;
	const routeKey = current.route.key;
	const beginCoordinatedCompletion = useCallback(
		(
			completionId: number,
			kind: LifecycleTransitionRequestKind,
			target: "open" | "close" | number,
		) => {
			const onTeardown =
				kind === LifecycleTransitionRequestKind.BlankStackClose
					? onBlankStackCloseFinish
					: kind === LifecycleTransitionRequestKind.NativeClose
						? onNativeCloseFinish
						: undefined;
			globalSmoothClipCoordinatorRuntime.beginCompletion({
				completionId,
				onTeardown,
				requiresReset: false,
				routeKey,
			});
			const isClosing =
				target === "close" || (typeof target === "number" && target === 0);
			const nativeAnimation = resolveSmoothClipNativeAnimation(
				isClosing ? transitionSpec?.close : transitionSpec?.open,
				"transition",
			);
			if (nativeAnimation) {
				void globalSmoothClipCoordinatorRuntime.requestRecordedBuiltInPromotion(
					{
						animation: nativeAnimation,
						routeKey,
						source: "transition",
						targetProgress:
							typeof target === "number" ? target : target === "open" ? 1 : 0,
					},
				);
			}
		},
		[onBlankStackCloseFinish, onNativeCloseFinish, routeKey, transitionSpec],
	);
	const completeCoordinatedReanimated = useCallback(
		(completionId: number, finished: boolean) => {
			globalSmoothClipCoordinatorRuntime.completeReanimated(
				completionId,
				finished,
			);
		},
		[],
	);

	useAnimatedReaction(
		() => {
			"worklet";
			return [
				pendingLifecycleRequestKind.get(),
				pendingLifecycleRequestTarget.get(),
				pendingLifecycleStartBlockCount.get(),
			] as const;
		},
		(next) => {
			"worklet";
			const [kind, target, blockCount] = next;

			if (kind === LifecycleTransitionRequestKind.None) {
				return;
			}

			if (blockCount > 0) {
				return;
			}

			const onAnimationFinish =
				kind === LifecycleTransitionRequestKind.BlankStackClose
					? onBlankStackCloseFinish
					: kind === LifecycleTransitionRequestKind.NativeClose
						? onNativeCloseFinish
						: undefined;

			const completionId = INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION
				? allocateClipGestureReleaseIdOnUI()
				: undefined;
			if (completionId !== undefined) {
				runOnJS(beginCoordinatedCompletion)(completionId, kind, target);
			}

			animateToProgress({
				target,
				spec: transitionSpec,
				animations,
				targetProgress,
				onAnimationFinish:
					completionId === undefined ? onAnimationFinish : undefined,
				onIdentifiedAnimationFinish:
					completionId === undefined
						? undefined
						: completeCoordinatedReanimated,
				completionId,
				deferClosePaintBarrier: completionId !== undefined,
			});

			clearLifecycleTransitionRequest();
		},
	);
};
