import { useMemo, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { ActiveGesture } from "../../../../types/gesture.types";
import type {
	MotionAnimationValues,
	MotionGestureValues,
	MotionValues,
} from "../types";

function useAnimationValues(): MotionAnimationValues {
	const values = {
		transitionProgress: useSharedValue(0),
		visualProgress: useSharedValue(0),
		willAnimate: useSharedValue(0),
		closing: useSharedValue(0),
		progressAnimating: useSharedValue(0),
		progressSettled: useSharedValue(1),
		entering: useSharedValue(0),
	};
	const [state] = useState(values);
	return state;
}

function useGestureValues(): MotionGestureValues {
	const progressBaseline = useSharedValue(0);
	const progressDeltaX = useSharedValue(0);
	const progressDeltaY = useSharedValue(0);
	const lockedSnapPoint = useSharedValue<number | null>(null);
	const normX = useSharedValue(0);
	const normY = useSharedValue(0);
	const scale = useSharedValue(1);
	const normScale = useSharedValue(0);
	const dismissing = useSharedValue(0);
	const dragging = useSharedValue(0);
	const settling = useSharedValue(0);
	const initiator = useSharedValue<ActiveGesture | null>(null);

	const values = {
		x: useSharedValue(0),
		y: useSharedValue(0),
		normX,
		normY,
		velocity: useSharedValue(0),
		scale,
		normScale,
		focalX: useSharedValue(0),
		focalY: useSharedValue(0),
		pinchOriginX: useSharedValue(0),
		pinchOriginY: useSharedValue(0),
		rotation: useSharedValue(0),
		raw: {
			x: useSharedValue(0),
			y: useSharedValue(0),
			normX: useSharedValue(0),
			normY: useSharedValue(0),
			scale: useSharedValue(1),
			normScale: useSharedValue(0),
			rotation: useSharedValue(0),
		},
		internal: {
			progressBaseline,
			progressDeltaX,
			progressDeltaY,
			lockedSnapPoint,
			snapshot: {
				x: useSharedValue(0),
				y: useSharedValue(0),
				normX: useSharedValue(0),
				normY: useSharedValue(0),
				velocity: useSharedValue(0),
				scale: useSharedValue(1),
				normScale: useSharedValue(0),
				focalX: useSharedValue(0),
				focalY: useSharedValue(0),
				pinchOriginX: useSharedValue(0),
				pinchOriginY: useSharedValue(0),
				rotation: useSharedValue(0),
				raw: {
					x: useSharedValue(0),
					y: useSharedValue(0),
					normX: useSharedValue(0),
					normY: useSharedValue(0),
					scale: useSharedValue(1),
					normScale: useSharedValue(0),
					rotation: useSharedValue(0),
				},
				active: useSharedValue<ActiveGesture | null>(null),
			},
		},
		dismissing,
		dragging,
		settling,
		initiator,
	};
	const [state] = useState(values);
	return state;
}

export function useMotionValues(): MotionValues {
	const animations = useAnimationValues();
	const gesture = useGestureValues();
	return useMemo(() => ({ ...animations, ...gesture }), [animations, gesture]);
}
