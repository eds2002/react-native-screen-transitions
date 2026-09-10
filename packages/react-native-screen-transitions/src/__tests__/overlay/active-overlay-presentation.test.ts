import { describe, expect, it } from "bun:test";
import type { BaseStackScene as StackScene } from "../../types/stack.types";
import {
	getFloatOverlayStack,
	getFloatOverlayTransitions,
} from "../../components/overlay/helpers/get-active-overlay";

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
	it("pairs sparse overlays with the next overlay's style driver", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B"),
			createScene("C", OverlayC),
			createScene("D"),
			createScene("E", OverlayE),
		];

		const transitions = getFloatOverlayTransitions(
			getFloatOverlayStack(scenes),
			scenes,
		);

		expect(
			transitions.map(({ scene, driverScene }) => [
				scene.route.key,
				driverScene.route.key,
			]),
		).toEqual([
			["A", "C"],
			["C", "E"],
			["E", "E"],
		]);
	});

	it("lets a plain top screen drive the last overlay", () => {
		const scenes = [createScene("A", OverlayA), createScene("B")];
		const transitions = getFloatOverlayTransitions(
			getFloatOverlayStack(scenes),
			scenes,
		);

		expect(transitions[0]?.driverScene.route.key).toBe("B");
	});

	it("keeps declared overlays in route order", () => {
		const scenes = [createScene("A", OverlayA), createScene("B")];

		expect(getFloatOverlayStack(scenes)).toEqual([
			{ scene: scenes[0], overlayIndex: 0 },
		]);
	});

	it("keeps every declared overlay when another overlay is pushed", () => {
		const scenes = [createScene("A", OverlayA), createScene("B", OverlayB)];

		expect(getFloatOverlayStack(scenes)).toEqual([
			{ scene: scenes[0], overlayIndex: 0 },
			{ scene: scenes[1], overlayIndex: 1 },
		]);
	});

	it("preserves all declared overlays without assigning presentation state", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B", OverlayB),
			createScene("C", OverlayC),
		];

		expect(getFloatOverlayStack(scenes)).toEqual([
			{ scene: scenes[0], overlayIndex: 0 },
			{ scene: scenes[1], overlayIndex: 1 },
			{ scene: scenes[2], overlayIndex: 2 },
		]);
	});

	it("keeps a closing overlay until its route is removed", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B", OverlayB),
			createScene("C", OverlayC),
		];
		scenes[2].activity = "closing";

		expect(getFloatOverlayStack(scenes)).toEqual([
			{ scene: scenes[0], overlayIndex: 0 },
			{ scene: scenes[1], overlayIndex: 1 },
			{ scene: scenes[2], overlayIndex: 2 },
		]);
		expect(getFloatOverlayStack(scenes.slice(0, 2))).toEqual([
			{ scene: scenes[0], overlayIndex: 0 },
			{ scene: scenes[1], overlayIndex: 1 },
		]);
	});

	it("excludes overlays explicitly hidden by their owner", () => {
		const scenes = [createScene("A", OverlayA), createScene("B", OverlayB)];
		scenes[1].descriptor.options.overlayShown = false;

		expect(getFloatOverlayStack(scenes)).toEqual([
			{ scene: scenes[0], overlayIndex: 0 },
		]);
	});

	it("lets a new overlay bypass a retained closing checkpoint", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B"),
			createScene("C-1", OverlayC),
			createScene("C-2", OverlayC),
		];
		scenes[2].activity = "closing";

		const transitions = getFloatOverlayTransitions(
			getFloatOverlayStack(scenes),
			scenes,
		);

		expect(
			transitions.map(({ scene, driverScene }) => [
				scene.route.key,
				driverScene.route.key,
			]),
		).toEqual([
			["A", "C-2"],
			["C-1", "C-1"],
			["C-2", "C-2"],
		]);
	});

	it("keeps every overlay candidate in deterministic stack order", () => {
		const scenes = [
			createScene("A", OverlayA),
			createScene("B", OverlayB),
			createScene("C", OverlayC),
			createScene("D", OverlayD),
			createScene("E", OverlayE),
		];

		expect(getFloatOverlayStack(scenes)).toEqual([
			{ scene: scenes[0], overlayIndex: 0 },
			{ scene: scenes[1], overlayIndex: 1 },
			{ scene: scenes[2], overlayIndex: 2 },
			{ scene: scenes[3], overlayIndex: 3 },
			{ scene: scenes[4], overlayIndex: 4 },
		]);
	});
});

it("does not require adapter opt-in to select overlays", () => {
 const scene = createScene("plain", OverlayA);
 expect(getFloatOverlayStack([scene])).toHaveLength(1);
});
