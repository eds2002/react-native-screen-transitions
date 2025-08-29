import {
	Gesture,
	type GestureStateChangeEvent,
	type GestureStateManager,
	type GestureTouchEvent,
	type GestureType,
	type GestureUpdateEvent,
	type PanGesture,
	type PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";

interface BuildComposedGesturesProps {
	gestureEnabled: boolean;
	onTouchesDown: (event: GestureTouchEvent) => void;
	onTouchesMove: (
		event: GestureTouchEvent,
		manager: GestureStateManager,
	) => void;
	onStart: () => void;
	onUpdate: (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => void;
	onEnd: (
		event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
	) => void;
	hitSlop?: HitSlop;
	gestureActivationArea: "edge" | "screen";
	gestureResponseDistance?: number;
}

type HitSlop = {
	left?: number;
	right?: number;
	top?: number;
	bottom?: number;
	width?: number;
	height?: number;
};

const GESTURE_RESPONSE_DISTANCE_HORIZONTAL = 50;
const GESTURE_RESPONSE_DISTANCE_VERTICAL = 135;

const makePan = ({
	gestureEnabled,
	onTouchesDown,
	onTouchesMove,
	onStart,
	onUpdate,
	onEnd,
	hitSlop,
	nativeGesture,
}: BuildComposedGesturesProps & { nativeGesture: GestureType }): PanGesture => {
	const panGesture = Gesture.Pan()
		.enabled(gestureEnabled)
		.manualActivation(true)
		.onTouchesDown(onTouchesDown)
		.onTouchesMove(onTouchesMove)
		.onStart(onStart)
		.onUpdate(onUpdate)
		.onEnd(onEnd)
		.hitSlop(hitSlop)
		.blocksExternalGesture(nativeGesture);

	return panGesture;
};

export const buildComposedGestures = ({
	gestureEnabled,
	onTouchesDown,
	onTouchesMove,
	onStart,
	onUpdate,
	onEnd,
	hitSlop,
	gestureActivationArea,
	gestureResponseDistance,
}: BuildComposedGesturesProps) => {
	const nativeGesture = Gesture.Native();
	const gestures: PanGesture[] = [];

	const commonProps = {
		gestureEnabled,
		onTouchesDown,
		onTouchesMove,
		onStart,
		onUpdate,
		onEnd,
		nativeGesture,
		gestureActivationArea,
		gestureResponseDistance,
	};

	const edges: Record<string, HitSlop> = {
		left: {
			left: 0,
			width: gestureResponseDistance ?? GESTURE_RESPONSE_DISTANCE_HORIZONTAL,
		},
		right: {
			right: 0,
			width: gestureResponseDistance ?? GESTURE_RESPONSE_DISTANCE_HORIZONTAL,
		},
		top: {
			top: 0,
			height: gestureResponseDistance ?? GESTURE_RESPONSE_DISTANCE_VERTICAL,
		},
		bottom: {
			bottom: 0,
			height: gestureResponseDistance ?? GESTURE_RESPONSE_DISTANCE_VERTICAL,
		},
	};

	if (gestureActivationArea === "edge") {
		for (const edge of Object.values(edges)) {
			gestures.push(
				makePan({
					...commonProps,
					hitSlop: edge,
				}),
			);
		}
	} else {
		gestures.push(
			makePan({
				...commonProps,
				hitSlop,
			}),
		);
	}

	const composedGesture = Gesture.Race(...gestures);
	return {
		panGesture: composedGesture,
		nativeGesture,
	};
};
