import { describe, expect, it } from "bun:test";
import { resolveSlotStyles } from "../providers/screen/styles/helpers/resolve-slot-styles";

describe("resolveSlotStyles", () => {
	it("resets disappeared style and prop keys with concrete identity values", () => {
		const firstPass = resolveSlotStyles({
			currentStylesMap: {
				content: {
					style: {
						transform: [{ scale: 0.8 }],
						opacity: 0.5,
						borderRadius: 16,
						translateX: 12,
					},
					props: {
						pointerEvents: "none",
						progress: 0.4,
					},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
		});

		const secondPass = resolveSlotStyles({
			currentStylesMap: {
				content: {
					style: {
						opacity: 1,
					},
					props: {},
				},
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: firstPass.nextPreviousStyleStatesBySlot,
		});

		expect(secondPass.resolvedStylesMap.content?.style).toEqual({
			transform: [
				{ translateX: 0 },
				{ translateY: 0 },
				{ scaleX: 1 },
				{ scaleY: 1 },
			],
			borderRadius: 0,
			translateX: 0,
			opacity: 1,
		});
		expect(secondPass.resolvedStylesMap.content?.props).toEqual({
			pointerEvents: "auto",
			progress: 0,
		});
	});
});
