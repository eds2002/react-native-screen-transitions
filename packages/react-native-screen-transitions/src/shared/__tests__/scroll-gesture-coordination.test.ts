import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import { NO_CLAIMS } from "../types/ownership.types";
import { walkUpScrollGestureCoordination } from "../providers/screen/gestures/hooks/use-scroll-gesture-coordination/walk-up-scroll-gesture-coordination";
import type {
	GestureContextType,
	ScrollGestureState,
} from "../providers/screen/gestures/types";

const createScrollState = (
	label: string,
): SharedValue<ScrollGestureState | null> =>
	({ label }) as unknown as SharedValue<ScrollGestureState | null>;

const createContext = (
	overrides: Partial<GestureContextType> = {},
): GestureContextType => {
	const panGesture = { kind: "pan" } as GestureContextType["panGesture"];
	const pinchGesture = { kind: "pinch" } as GestureContextType["pinchGesture"];

	return {
		detectorGesture: panGesture,
		panGesture,
		pinchGesture,
		scrollState: createScrollState("scroll"),
		gestureContext: null,
		claimedDirections: NO_CLAIMS,
		childDirectionClaims: { value: {} } as GestureContextType["childDirectionClaims"],
		...overrides,
	};
};

describe("walkUpScrollGestureCoordination", () => {
	it("collects pinch gestures even when no pan direction is claimed", () => {
		const pinchGesture = { kind: "pinch" } as NonNullable<
			GestureContextType["pinchGesture"]
		>;
		const context = createContext({
			pinchGesture,
			claimedDirections: NO_CLAIMS,
		});

		const result = walkUpScrollGestureCoordination(context, "vertical");

		expect(result.panGestures).toEqual([]);
		expect(result.pinchGestures).toEqual([pinchGesture]);
		expect(result.scrollStates).toEqual([]);
	});

	it("keeps pan axis ownership and adds pinch gestures from ancestors", () => {
		const parentPinch = { kind: "parent-pinch" } as NonNullable<
			GestureContextType["pinchGesture"]
		>;
		const childPinch = { kind: "child-pinch" } as NonNullable<
			GestureContextType["pinchGesture"]
		>;
		const parent = createContext({
			pinchGesture: parentPinch,
			claimedDirections: {
				...NO_CLAIMS,
				vertical: true,
			},
			scrollState: createScrollState("parent-scroll"),
		});
		const child = createContext({
			pinchGesture: childPinch,
			gestureContext: parent,
		});

		const result = walkUpScrollGestureCoordination(child, "vertical");

		expect(result.panGestures).toEqual([parent.panGesture]);
		expect(result.pinchGestures).toEqual([childPinch, parentPinch]);
		expect(result.scrollStates).toEqual([parent.scrollState]);
	});
});
