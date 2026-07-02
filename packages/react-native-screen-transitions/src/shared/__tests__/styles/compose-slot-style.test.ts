import { describe, expect, it } from "bun:test";
import {
	composeSlotStyleWithLocalTransform,
	getLocalTransformForSlotComposition,
} from "../../providers/screen/styles/helpers/compose-slot-style";

const createSharedValue = (initial: number) => ({
	_isReanimatedSharedValue: true,
	value: initial,
	get() {
		return this.value;
	},
});

describe("composeSlotStyleWithLocalTransform", () => {
	it("composes transition and local transforms without dropping shared values", () => {
		const scale = createSharedValue(0.5);
		const localTransform = [{ scale }];
		const slotStyle = {
			opacity: 0.8,
			transform: [{ translateX: 24 }, { scaleX: 1.2 }],
		};

		expect(
			composeSlotStyleWithLocalTransform(slotStyle, localTransform),
		).toEqual({
			opacity: 0.8,
			transform: [{ translateX: 24 }, { scaleX: 1.2 }, { scale: 0.5 }],
		});

		scale.value = 0.75;

		expect(
			composeSlotStyleWithLocalTransform(slotStyle, localTransform),
		).toEqual({
			opacity: 0.8,
			transform: [{ translateX: 24 }, { scaleX: 1.2 }, { scale: 0.75 }],
		});
	});

	it("leaves slot styles without transition transforms untouched", () => {
		const slotStyle = { opacity: 0.4 };

		expect(
			composeSlotStyleWithLocalTransform(slotStyle, [{ scale: 0.5 }]),
		).toBe(slotStyle);
	});

	it("extracts transform arrays from flattened local styles", () => {
		const transform = [{ translateY: 12 }, { scale: 0.5 }];

		expect(
			getLocalTransformForSlotComposition([
				{ opacity: 0.2 },
				{ transform },
			]),
		).toBe(transform);
	});
});
