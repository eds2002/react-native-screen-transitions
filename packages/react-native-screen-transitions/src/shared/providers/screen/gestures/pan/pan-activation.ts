import { useCallback, useMemo } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { GestureStore } from "../../../../stores/gesture.store";
import { GestureActivationState } from "../../../../types/gesture.types";
import { useDescriptorDerivations } from "../../descriptors";
import type { ScreenOptionsContextValue } from "../../options";
import { resolvePanRuntime } from "../shared/runtime";
import type {
	DirectionClaimMap,
	GestureDimensions,
	PanGestureRuntime,
	ScrollGestureState,
} from "../types";
import { resolvePanActivationMoveDecision } from "./pan-activation-decision";

interface UsePanActivationProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	runtime: SharedValue<PanGestureRuntime>;
	screenOptions: ScreenOptionsContextValue;
	dimensions: GestureDimensions;
}

export const usePanActivation = ({
	scrollState,
	childDirectionClaims,
	runtime,
	screenOptions,
	dimensions,
}: UsePanActivationProps) => {
	const { currentScreenKey, parentScreenKey } = useDescriptorDerivations();

	const ancestorDismissing = useMemo(() => {
		if (!parentScreenKey) return null;
		return GestureStore.peekBag(parentScreenKey)?.dismissing ?? null;
	}, [parentScreenKey]);

	const initialTouch = useSharedValue({ x: 0, y: 0 });

	const gestureActivationState = useSharedValue<GestureActivationState>(
		GestureActivationState.PENDING,
	);

	const onTouchesDown = useCallback(
		(
			event: GestureTouchEvent,
			stateManager: GestureStateManager | undefined,
		) => {
			"worklet";
			const { participation, policy } = resolvePanRuntime(
				runtime.get(),
				screenOptions.get(),
			);

			if (
				!participation.canTrackGesture ||
				!policy.enabled ||
				event.numberOfTouches !== 1
			) {
				gestureActivationState.set(GestureActivationState.FAILED);
				stateManager?.fail();
				return;
			}

			const firstTouch = event.changedTouches[0];
			initialTouch.set({ x: firstTouch.x, y: firstTouch.y });
			gestureActivationState.set(GestureActivationState.PENDING);
		},
		[gestureActivationState, initialTouch, runtime, screenOptions],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent, stateManager: GestureStateManager) => {
			"worklet";

			const currentActivationState = gestureActivationState.get();
			const resolvedRuntime = resolvePanRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const decision = resolvePanActivationMoveDecision({
				event,
				runtime: resolvedRuntime,
				dimensions,
				initialTouch: initialTouch.get(),
				activationState: currentActivationState,
				ancestorDismissing: Boolean(ancestorDismissing?.get()),
				childDirectionClaims: childDirectionClaims.get(),
				currentScreenKey,
				scrollState: scrollState.get(),
			});

			if (decision.nextActivationState !== currentActivationState) {
				gestureActivationState.set(decision.nextActivationState);
			}

			if (decision.action === "fail") {
				stateManager.fail();
				return;
			}

			if (decision.action === "wait") {
				return;
			}

			if (decision.direction) {
				const { gestures } = resolvedRuntime.stores;
				gestures.active.set(decision.direction);
				gestures.direction.set(decision.direction);
			}

			stateManager.activate();
		},
		[
			ancestorDismissing,
			childDirectionClaims,
			currentScreenKey,
			dimensions,
			gestureActivationState,
			initialTouch,
			runtime,
			screenOptions,
			scrollState,
		],
	);

	return useMemo(
		() => ({ onTouchesDown, onTouchesMove }),
		[onTouchesDown, onTouchesMove],
	);
};
