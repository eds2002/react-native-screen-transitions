import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { VELOCITY_FLAP_STYLE_ID } from "./constants";

const MAX_VELOCITY_ROTATION = 24; // maybe 24 max
const MAX_DRAG_ROTATION = 360;
const VELOCITY_EPSILON = 0.001;

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
		const gestureLength = Math.sqrt(
			gesture.normX * gesture.normX + gesture.normY * gesture.normY,
		);
		const directionX =
			gestureLength > VELOCITY_EPSILON ? gesture.normX / gestureLength : 0;
		const directionY =
			gestureLength > VELOCITY_EPSILON ? gesture.normY / gestureLength : 0;
		const velocity = easeVelocity(gesture.velocity);
		const rotation = clampRotationVector(
			gesture.normY * MAX_DRAG_ROTATION -
				directionY * velocity * MAX_VELOCITY_ROTATION,
			-gesture.normX * MAX_DRAG_ROTATION +
				directionX * velocity * MAX_VELOCITY_ROTATION,
			MAX_VELOCITY_ROTATION,
		);

		return {
			[VELOCITY_FLAP_STYLE_ID]: {
				style: {
					transform: [
						{ perspective: 200 },
						{ translateX: gesture.x },
						{ translateY: gesture.y },
						{ scale: gesture.scale },
						{ rotateZ: `${gesture.rotation}rad` },
						{ rotateX: `${rotation.x}deg` },
						{ rotateY: `${rotation.y}deg` },
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
							damping: 15,
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
