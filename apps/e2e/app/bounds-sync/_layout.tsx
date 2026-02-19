import { Extrapolation, interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { ALL_CASES, activeCaseId, BOUNDARY_TAG } from "./constants";

/**
 * Resolves the bounds options for the active test case on the UI thread.
 * ALL_CASES is a static array so it's safe to read from worklets.
 */
const resolveActiveCase = () => {
	"worklet";
	const id = activeCaseId.value;
	for (let i = 0; i < ALL_CASES.length; i++) {
		if (ALL_CASES[i].id === id) {
			return ALL_CASES[i];
		}
	}
	return ALL_CASES[0];
};

/**
 * The sync interpolator — only applied to the source→destination transition.
 * Uses explicit bounds options from the active test case for deterministic
 * method/anchor/scaleMode/target coverage.
 */
const syncInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] = ({
	bounds,
	progress,
	focused,
}) => {
	"worklet";

	const testCase = resolveActiveCase();
	const sourceBoundary = testCase.source.boundary;
	const destinationBoundary = testCase.destination.boundary;
	const activeBoundary = focused ? destinationBoundary : sourceBoundary;
	const activeStyleOptions = {
		id: BOUNDARY_TAG,
		method: activeBoundary?.method,
		anchor: activeBoundary?.anchor,
		scaleMode: activeBoundary?.scaleMode,
		target: activeBoundary?.target,
	};

	if (destinationBoundary?.method === "content") {
		// Content method: screen-level transform on focused,
		// element-level transform on unfocused.
		// The destination Boundary has method="content", source has method="transform".
		if (focused) {
			const contentStyle = bounds(activeStyleOptions);

			return {
				contentStyle,
				overlayStyle: {
					backgroundColor: "black",
					opacity: interpolate(progress, [0, 1], [0, 0.5]),
				},
			};
		}

		const elementStyle = bounds(activeStyleOptions) as Record<string, any>;

		return {
			[BOUNDARY_TAG]: {
				...elementStyle,
				opacity: focused
					? interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP)
					: interpolate(progress, [1, 2], [1, 0], Extrapolation.CLAMP),
			},
		};
	}

	// For transform and size methods: apply directly to the element on both screens.
	const elementStyle = bounds(activeStyleOptions) as Record<string, any>;

	return {
		[BOUNDARY_TAG]: {
			...elementStyle,
			opacity: focused
				? interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP)
				: interpolate(progress, [1, 2], [1, 0], Extrapolation.CLAMP),
		},
	};
};

export default function BoundsSyncLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="source"
				options={{
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<BlankStack.Screen
				name="destination"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical-inverted", "vertical"],
					screenStyleInterpolator: syncInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
