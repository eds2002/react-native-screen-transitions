import { useCallback, useMemo } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { GestureStore } from "../../../../../stores/gesture.store";
import { GestureActivationState } from "../../../../../types/gesture.types";
import { useDescriptorDerivations } from "../../../descriptors";
import type { ScreenOptionsContextValue } from "../../../options";
import { resolvePanRuntime } from "../../shared/runtime";
import type {
	DirectionClaimMap,
	GestureCompositionOwner,
	GestureDimensions,
	PanGestureRuntime,
	ScrollGestureState,
} from "../../types";
import { resolvePanActivationMoveDecision } from "./pan-activation-decision";

interface UsePanActivationProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	runtime: SharedValue<PanGestureRuntime>;
	screenOptions: ScreenOptionsContextValue;
	dimensions: GestureDimensions;
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>;
}

export const usePanActivation = ({
	scrollState,
	childDirectionClaims,
	runtime,
	screenOptions,
	dimensions,
	gestureCompositionOwner,
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
			const { participation } = resolvePanRuntime(
				runtime.get(),
				screenOptions.get(),
			);

			if (!participation.canTrackGesture) {
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

			// If another gesture owns this composition, let pan join as a
			// companion tracker instead of running normal pan activation gates.
			if (
				gestureCompositionOwner.get() !== null &&
				resolvedRuntime.participation.canTrackGesture &&
				resolvedRuntime.policy.enabled
			) {
				stateManager.activate();
				return;
			}

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

			gestureCompositionOwner.set("pan");
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
			gestureCompositionOwner,
		],
	);

	return useMemo(
		() => ({ onTouchesDown, onTouchesMove }),
		[onTouchesDown, onTouchesMove],
	);
};
