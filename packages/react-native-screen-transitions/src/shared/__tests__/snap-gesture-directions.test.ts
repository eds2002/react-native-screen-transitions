import { describe, expect, it } from "bun:test";
import { SnapPanStrategy } from "../providers/screen/gestures/behaviors/strategies/pan-snap.strategy";
import { SnapPinchStrategy } from "../providers/screen/gestures/behaviors/strategies/pinch-snap.strategy";
import {
	getPanActivationDirections,
	getPanSnapAxisDirections,
	getSnapPinchDirectionConfig,
} from "../providers/screen/gestures/helpers/gesture-directions";
import type { GestureDirection } from "../types/gesture.types";

function sharedValue<T>(initial: T) {
	let value = initial;

	return {
		get: () => value,
		set: (next: T) => {
			value = next;
		},
	} as any;
}

function createSnapRuntimeBase(startProgress: number) {
	return {
		participation: {
			canDismiss: true,
			effectiveSnapPoints: {
				hasAutoSnapPoint: false,
				snapPoints: [0.5, 1],
				minSnapPoint: 0,
				maxSnapPoint: 1,
			},
		},
		stores: {
			system: {
				resolvedAutoSnapPoint: sharedValue(0),
			},
		},
		gestureProgressBaseline: sharedValue(startProgress),
		lockedSnapPoint: sharedValue(1),
	};
}

function createPanSnapRuntime(
	gestureDirection: GestureDirection | GestureDirection[],
	activeDirection: string,
	startProgress: number,
) {
	const base = createSnapRuntimeBase(startProgress);

	return {
		...base,
		policy: {
			snapAxisDirections: getPanSnapAxisDirections(gestureDirection),
			gestureSnapLocked: false,
		},
		stores: {
			...base.stores,
			gestures: {
				gesture: sharedValue(activeDirection),
				direction: sharedValue(activeDirection),
			},
		},
	} as any;
}

function createPinchSnapRuntime(
	gestureDirection: GestureDirection | GestureDirection[],
	startProgress: number,
) {
	return {
		...createSnapRuntimeBase(startProgress),
		policy: {
			snapDirections: getSnapPinchDirectionConfig(gestureDirection),
			gestureSnapLocked: false,
		},
	} as any;
}

describe("snap gesture directions", () => {
	it("enables both activation directions for every configured snap pan axis", () => {
		const directions = getPanActivationDirections({
			gestureDirection: ["horizontal", "vertical"],
			hasSnapPoints: true,
		});

		expect(directions.horizontal).toBe(true);
		expect(directions.horizontalInverted).toBe(true);
		expect(directions.vertical).toBe(true);
		expect(directions.verticalInverted).toBe(true);
	});

	it("uses the first direction on each pan axis as collapse", () => {
		const snapAxisDirections = getPanSnapAxisDirections([
			"horizontal",
			"vertical-inverted",
			"vertical",
		]);

		expect(snapAxisDirections.horizontal?.collapse).toBe("horizontal");
		expect(snapAxisDirections.horizontal?.expand).toBe("horizontal-inverted");
		expect(snapAxisDirections.vertical?.collapse).toBe("vertical-inverted");
		expect(snapAxisDirections.vertical?.expand).toBe("vertical");
	});

	it("maps each active pan snap direction to collapse or expand progress", () => {
		const dimensions = { width: 1000, height: 1000 };

		expect(
			SnapPanStrategy.resolveProgress(
				createPanSnapRuntime(
					["horizontal", "vertical-inverted"],
					"horizontal",
					1,
				),
				dimensions,
				{ x: 100, y: 0, normX: 0.1, normY: 0 },
			),
		).toBe(0.9);

		expect(
			SnapPanStrategy.resolveProgress(
				createPanSnapRuntime(
					["horizontal", "vertical-inverted"],
					"vertical-inverted",
					1,
				),
				dimensions,
				{ x: 0, y: -100, normX: 0, normY: -0.1 },
			),
		).toBe(0.9);
	});

	it("uses the first pinch direction as collapse", () => {
		expect(getSnapPinchDirectionConfig(["pinch-out", "pinch-in"])).toEqual({
			collapse: "pinch-out",
			expand: "pinch-in",
		});
	});

	it("maps first pinch snap direction to collapse and the inverse to expand", () => {
		expect(
			SnapPinchStrategy.resolveProgress(
				createPinchSnapRuntime("pinch-out", 1),
				{ scale: 1.2, normScale: 0.2 },
			),
		).toBe(0.8);

		expect(
			SnapPinchStrategy.resolveProgress(
				createPinchSnapRuntime("pinch-out", 0.5),
				{ scale: 0.8, normScale: -0.2 },
			),
		).toBe(0.7);
	});
});
