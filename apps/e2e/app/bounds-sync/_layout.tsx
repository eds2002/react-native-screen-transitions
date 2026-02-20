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

const toZoomId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;

	if (typeof rawId !== "string") {
		return null;
	}

	return rawId;
};

/**
 * Bounds-sync interpolator for element-transition coverage only.
 * This validates A/B boundary interpolation behavior (transform/size/content)
 * and is intentionally separate from navigation primitives such as
 * bounds({ id }).navigation.zoom()/hero().
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
	// Anchor semantics are resolved per screen:
	// - focused screen uses destination boundary config
	// - unfocused screen uses source boundary config
	// This is why asymmetric anchors (source !== destination) are intentional.
	const activeBoundary = focused ? destinationBoundary : sourceBoundary;
	const activeStyleOptions = {
		id: BOUNDARY_TAG,
		method: activeBoundary?.method,
		anchor: activeBoundary?.anchor,
		scaleMode: activeBoundary?.scaleMode,
		target: activeBoundary?.target,
	};

	if (destinationBoundary?.method === "content") {
		// Content method in this harness still belongs to the element concern:
		// screen-level content transform on focused, element-style on unfocused.
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

const navigationZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, current, active, progress }) => {
		"worklet";
		const currentId = toZoomId(current.route);
		const activeId = toZoomId(active.route);
		const id = currentId ?? activeId;

		if (!id) {
			return {};
		}

		const navigationStyles = bounds({ id }).navigation.zoom({
			scaleMode: "uniform",
			maskBorderRadius: 28,
		});

		return {
			...navigationStyles,
			overlayStyle: {
				backgroundColor: "black",
				opacity: interpolate(progress, [0, 1, 2], [0, 0.5, 0]),
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
			<BlankStack.Screen name="zoom/index" />
			<BlankStack.Screen
				name="zoom/[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureReleaseVelocityScale: 1.6,
					gestureDrivesProgress: false,
					screenStyleInterpolator: navigationZoomInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
