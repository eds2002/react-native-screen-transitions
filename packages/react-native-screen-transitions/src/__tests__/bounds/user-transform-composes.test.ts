import { describe, expect, it } from "bun:test";
import { applyBoundsScreenFrames } from "../../utils/bounds/helpers/styles/apply-screen-frames";
import { attachBoundsScreenFrame } from "../../utils/bounds/helpers/styles/screen-frame";
import type { ScreenTransform } from "../../utils/bounds/types/geometry";

const IDENTITY: ScreenTransform = { sx: 1, sy: 1, tx: 0, ty: 0, width: 400, height: 800 };
const layout = { pageX: 20, pageY: 300, width: 200, height: 100, x: 20, y: 300 };

/** What `bounds("card").styles()` returns mid-flight, unmoved screens. */
const boundsStyles = (transform: unknown[]) =>
	attachBoundsScreenFrame({ transform } as never, {
		tag: "card",
		t: 0.5,
		sourceScreenKey: "A",
		destinationScreenKey: "B",
		screenKey: "B",
		layout,
		start: { ...layout, pageX: 100, pageY: 600, width: 100, height: 50 },
		end: layout,
		startChain: [],
	}) as Record<string, unknown>;

const placed = (style: Record<string, unknown>) =>
	(
		applyBoundsScreenFrames({ card: { style } } as never, {
			A: IDENTITY,
			B: IDENTITY,
		}) as unknown as Record<string, { style: { transform: unknown[] } }>
	).card.style.transform;

describe("a transform returned with the bounds styles", () => {
	const flight = [{ translateX: 40 }, { translateY: 150 }, { scaleX: 0.75 }, { scaleY: 0.75 }];

	it("composes after the bounds transform instead of replacing it", () => {
		const styles = boundsStyles(flight);
		const user = { ...styles, transform: [{ rotate: "5deg" }] };
		expect(placed(user)).toEqual([...flight, { rotate: "5deg" }]);
	});

	it("leaves the bounds transform alone when it comes back as it was (or copied)", () => {
		const styles = boundsStyles(flight);
		expect(placed(styles)).toEqual(flight);
		const copied = { ...styles, transform: flight.map((step) => ({ ...step })) };
		expect(placed(copied)).toEqual(flight);
	});
});
