import { describe, expect, it } from "bun:test";
import type { StackScene } from "../../hooks/navigation/use-stack";
import { getFloatOverlayStack } from "../../components/overlay/helpers/get-active-overlay";

const OverlayA = () => null;
const OverlayB = () => null;
const OverlayC = () => null;
const OverlayD = () => null;
const OverlayE = () => null;

const createScene = (
	key: string,
	overlay?: typeof OverlayA,
): StackScene =>
	({
		activity: "active",
		route: { key, name: key },
		descriptor: {
			route: { key, name: key },
			options: { overlay },
		},
	}) as StackScene;

describe("floating overlay presentation", () => {
	it("when B has no overlay, keeps A as the active overlay", () => {
		const scenes = [createScene("A", OverlayA), createScene("B")];

		expect(getFloatOverlayStack(scenes, true)).toEqual([
			{ scene: scenes[0], overlayIndex: 0, activity: "active" },
		]);
	});

	it("when B starts an overlay, keeps A visible and makes B active", () => {
		const scenes = [createScene("A", OverlayA), createScene("B", OverlayB)];

		expect(getFloatOverlayStack(scenes, true)).toEqual([
			{ scene: scenes[0], overlayIndex: 0, activity: "inert" },
			{ scene: scenes[1], overlayIndex: 1, activity: "active" },
		]);
	});

	it("when C starts an overlay, hides A and keeps B visible underneath C", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B", OverlayB),
			createScene("C", OverlayC),
		];

		expect(getFloatOverlayStack(scenes, true)).toEqual([
			{ scene: scenes[0], overlayIndex: 0, activity: "inactive" },
			{ scene: scenes[1], overlayIndex: 1, activity: "inert" },
			{ scene: scenes[2], overlayIndex: 2, activity: "active" },
		]);
	});

	it("when C closes back to B, keeps C above B until C leaves", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B", OverlayB),
			createScene("C", OverlayC),
		];
		scenes[2].activity = "closing";

		expect(getFloatOverlayStack(scenes, true)).toEqual([
			{ scene: scenes[0], overlayIndex: 0, activity: "inactive" },
			{ scene: scenes[1], overlayIndex: 1, activity: "inert" },
			{ scene: scenes[2], overlayIndex: 2, activity: "closing" },
		]);
	});

	it("with A through E overlays, keeps D visible underneath E", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B", OverlayB),
			createScene("C", OverlayC),
			createScene("D", OverlayD),
			createScene("E", OverlayE),
		];

		expect(getFloatOverlayStack(scenes, true)).toEqual([
			{ scene: scenes[0], overlayIndex: 0, activity: "inactive" },
			{ scene: scenes[1], overlayIndex: 1, activity: "inactive" },
			{ scene: scenes[2], overlayIndex: 2, activity: "inactive" },
			{ scene: scenes[3], overlayIndex: 3, activity: "inert" },
			{ scene: scenes[4], overlayIndex: 4, activity: "active" },
		]);
	});
});
