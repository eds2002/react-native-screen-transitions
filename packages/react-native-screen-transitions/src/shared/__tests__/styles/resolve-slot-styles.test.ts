import { describe, expect, it } from "bun:test";
import { resolveSlotStyles } from "../../providers/screen/styles/helpers/resolve-slot-styles";

const A_SURFACE_STYLE = {
	backgroundColor: "#4A90E2",
	borderRadius: 48,
	overflow: "hidden",
};

const A_SURFACE_RESET = {
	backgroundColor: "transparent",
	borderRadius: 0,
	overflow: "visible",
};

const resolveAOwnStyles = () =>
	resolveSlotStyles({
		currentStylesMap: {
			surface: {
				style: A_SURFACE_STYLE,
			},
		},
		ancestorStylesMap: {},
		previousStyleStatesBySlot: {},
	});

describe("resolveSlotStyles", () => {
	it("does not reset A interpolator styles when B mounts", () => {
		const aPass = resolveAOwnStyles();

		const bMountedPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: aPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		expect(bMountedPass.resolvedStylesMap.surface).toBeUndefined();
		expect(bMountedPass.nextPreviousStyleStatesBySlot).toEqual(
			aPass.nextPreviousStyleStatesBySlot,
		);
	});

	it("resets deferred A interpolator styles when B unmounts", () => {
		const aPass = resolveAOwnStyles();
		const bMountedPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: aPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		const bUnmountedPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: bMountedPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: false,
		});

		expect(bUnmountedPass.resolvedStylesMap.surface?.style).toEqual(
			A_SURFACE_RESET,
		);
	});

	it("resets A styles inherited from B when B stops providing them", () => {
		const inheritedSlot = {
			style: {
				opacity: 0.5,
				borderRadius: 16,
			},
		};

		const bMountedPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {
				sharedHeader: inheritedSlot,
			},
			previousStyleStatesBySlot: {},
		});

		const bUnmountedPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: bMountedPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: false,
		});

		expect(bMountedPass.resolvedStylesMap.sharedHeader).toBe(inheritedSlot);
		expect(bUnmountedPass.resolvedStylesMap.sharedHeader?.style).toEqual({
			opacity: 1,
			borderRadius: 0,
		});
	});

	it("resets dropped custom style ids even while screen resets are deferred", () => {
		const firstPass = resolveSlotStyles({
			currentStylesMap: {
				card: {
					style: {
						opacity: 0.1,
						zIndex: 0,
						elevation: 0,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
			deferLocalSlotResets: true,
		});

		const droppedPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: firstPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		expect(droppedPass.resolvedStylesMap.card?.style).toEqual({
			opacity: 1,
			zIndex: 0,
			elevation: 0,
		});
		expect(droppedPass.nextPreviousStyleStatesBySlot.card).toBeUndefined();
	});

	it("resets the old custom style id when a new custom id replaces it", () => {
		const boxOnePass = resolveSlotStyles({
			currentStylesMap: {
				"zoom:box1": {
					style: {
						opacity: 0.1,
						zIndex: 0,
						elevation: 0,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
			deferLocalSlotResets: true,
		});

		const boxTwoPass = resolveSlotStyles({
			currentStylesMap: {
				"zoom:box2": {
					style: {
						opacity: 0.1,
						zIndex: 0,
						elevation: 0,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: boxOnePass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		expect(boxTwoPass.resolvedStylesMap["zoom:box1"]?.style).toEqual({
			opacity: 1,
			zIndex: 0,
			elevation: 0,
		});
		expect(boxTwoPass.resolvedStylesMap["zoom:box2"]?.style).toEqual({
			opacity: 0.1,
			zIndex: 0,
			elevation: 0,
		});
		expect(boxTwoPass.nextPreviousStyleStatesBySlot["zoom:box1"]).toBeUndefined();
		expect(boxTwoPass.nextPreviousStyleStatesBySlot["zoom:box2"]).toBeDefined();
	});

	it("does not reset a custom style id while it is still inherited", () => {
		const boxOnePass = resolveSlotStyles({
			currentStylesMap: {
				"zoom:box1": {
					style: {
						opacity: 0.1,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
			deferLocalSlotResets: true,
		});

		const deferredPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {
				"zoom:box1": {
					style: {
						opacity: 0.1,
					},
				},
			},
			previousStyleStatesBySlot: boxOnePass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		expect(deferredPass.resolvedStylesMap["zoom:box1"]?.style).toEqual({
			opacity: 0.1,
		});
		expect(deferredPass.nextPreviousStyleStatesBySlot["zoom:box1"]).toBeDefined();
	});

	it("resets dropped local slot keys while local missing-slot resets are deferred", () => {
		const firstPass = resolveSlotStyles({
			currentStylesMap: {
				content: {
					style: {
						opacity: 0.5,
						zIndex: 9999,
						elevation: 9999,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
			deferLocalSlotResets: true,
		});

		const droppedKeyPass = resolveSlotStyles({
			currentStylesMap: {
				content: {
					style: {
						opacity: 0.5,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: firstPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		expect(droppedKeyPass.resolvedStylesMap.content?.style).toEqual({
			zIndex: 0,
			elevation: 0,
			opacity: 0.5,
		});
		expect(
			droppedKeyPass.nextPreviousStyleStatesBySlot.content?.styleKeys,
		).toEqual({
			opacity: true,
		});
	});

	it("emits reset patches once for disappeared custom style ids", () => {
		const firstPass = resolveSlotStyles({
			currentStylesMap: {
				card: {
					style: {
						opacity: 0.1,
						zIndex: 9999,
						elevation: 9999,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
			deferLocalSlotResets: true,
		});

		const resetPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: firstPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		const settledPass = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: resetPass.nextPreviousStyleStatesBySlot,
			deferLocalSlotResets: true,
		});

		expect(resetPass.resolvedStylesMap.card?.style).toEqual({
			opacity: 1,
			zIndex: 0,
			elevation: 0,
		});
		expect(resetPass.nextPreviousStyleStatesBySlot.card).toBeUndefined();
		expect(settledPass.resolvedStylesMap.card).toBeUndefined();
	});
});
