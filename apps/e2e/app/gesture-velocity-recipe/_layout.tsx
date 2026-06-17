import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import {
	VELOCITY_FLAP_FOCAL_STYLE_ID,
	VELOCITY_FLAP_STYLE_ID,
} from "./constants";

const MAX_VELOCITY_ROTATION = 24; // maybe 24 max
const MAX_DRAG_ROTATION = 360;
const VELOCITY_EPSILON = 0.001;
const FOCAL_POINT_RADIUS = 18;

const clampRotationVector = (x: number, y: number, maxRotation: number) => {
	"worklet";
	const length = Math.sqrt(x * x + y * y);

	if (length <= maxRotation || length === 0) {
		return { x, y };
	}

	const scale = maxRotation / length;
	return {
		x: x * scale,
		y: y * scale,
	};
};

const easeVelocity = (velocity: number) => {
	"worklet";
	const clamped = Math.min(1, Math.max(0, velocity));
	return clamped * clamped;
};

const velocityFlapInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ active }) => {
		"worklet";
		const { gesture } = active;
		const focalGesture = gesture.dismissing ? gesture.handoff : gesture;
		const gestureLength = Math.sqrt(
			gesture.normX * gesture.normX + gesture.normY * gesture.normY,
		);
		const directionX =
			gestureLength > VELOCITY_EPSILON ? gesture.normX / gestureLength : 0;
		const directionY =
			gestureLength > VELOCITY_EPSILON ? gesture.normY / gestureLength : 0;
		const velocity = easeVelocity(gesture.velocity);

		const hasFocal = focalGesture.focalX > 0 || focalGesture.focalY > 0 ? 1 : 0;
		const focalVelocity = easeVelocity(focalGesture.velocity);
		const focalPressure = Math.min(
			1,
			Math.abs(focalGesture.normScale) * 2 +
				Math.abs(focalGesture.rotation) * 0.8 +
				focalVelocity * 0.35,
		);

		const dragAmount = Math.max(
			Math.abs(gesture.normX),
			Math.abs(gesture.normY),
		);

		const dragRotation = {
			x: gesture.normY * MAX_DRAG_ROTATION * dragAmount,
			y: -gesture.normX * MAX_DRAG_ROTATION * dragAmount,
		};

		const velocityRotation = clampRotationVector(
			-directionY * velocity * MAX_VELOCITY_ROTATION,
			directionX * velocity * MAX_VELOCITY_ROTATION,
			MAX_VELOCITY_ROTATION,
		);

		const rotation = {
			x: dragRotation.x + velocityRotation.x,
			y: dragRotation.y + velocityRotation.y,
		};
		return {
			[VELOCITY_FLAP_STYLE_ID]: {
				style: {
					transform: [
						{ perspective: interpolate(dragAmount, [0, 1], [500, 200]) },
						{ translateX: gesture.x },
						{ translateY: gesture.y },
						{ scale: gesture.scale },
						{ rotateZ: `${gesture.rotation}rad` },
						{ rotateX: `${rotation.x}deg` },
						{ rotateY: `${rotation.y}deg` },
					],
				},
			},
			[VELOCITY_FLAP_FOCAL_STYLE_ID]: {
				style: {
					opacity: hasFocal * (0.28 + focalPressure * 0.72),
					transform: [
						{ translateX: focalGesture.focalX - FOCAL_POINT_RADIUS },
						{ translateY: focalGesture.focalY - FOCAL_POINT_RADIUS },
						{ scale: 0.65 + focalPressure * 0.65 },
					],
				},
			},
		};
	};

export default function GestureVelocityRecipeLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="test"
				options={{
					gestureEnabled: false,
					gestureTracking: "always",
					gestureDirection: ["bidirectional", "pinch-in", "pinch-out"],
					gestureReleaseVelocityScale: 1.6,
					screenStyleInterpolator: velocityFlapInterpolator,
					transitionSpec: {
						open: {
							stiffness: 200,
							damping: 10,
							mass: 1,
							overshootClamping: false,
						},
						close: {
							stiffness: 200,
							damping: 8,
							mass: 1,
							overshootClamping: false,
						},
					},
				}}
			/>
		</BlankStack>
	);
}
