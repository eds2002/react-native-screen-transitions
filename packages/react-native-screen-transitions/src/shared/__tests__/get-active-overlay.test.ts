import { describe, expect, it } from "bun:test";
import { getActiveFloatOverlay } from "../components/overlay/helpers/get-active-overlay";

const makeScene = ({
	key,
	overlay = true,
	overlayShown = true,
	enableTransitions = true,
}: {
	key: string;
	overlay?: boolean;
	overlayShown?: boolean;
	enableTransitions?: boolean;
}) =>
	({
		route: { key, name: key },
		descriptor: {
			route: { key, name: key },
			navigation: {} as any,
			options: {
				enableTransitions,
				overlay: overlay ? (() => null) : undefined,
				overlayShown,
			},
		},
	}) as const;

describe("getActiveFloatOverlay", () => {
	it("returns the top-most visible overlay", () => {
		const scenes = [
			makeScene({ key: "base", overlay: false }),
			makeScene({ key: "middle" }),
			makeScene({ key: "top" }),
		];

		expect(getActiveFloatOverlay(scenes as any, true)).toMatchObject({
			scene: scenes[2],
			overlayIndex: 2,
		});
	});

	it("skips native-stack screens without transitions when transitions are not always on", () => {
		const scenes = [
			makeScene({ key: "base" }),
			makeScene({ key: "top", enableTransitions: false }),
		];

		expect(getActiveFloatOverlay(scenes as any, false)).toMatchObject({
			scene: scenes[0],
			overlayIndex: 0,
		});
	});

	it("allows overlays on screens without enableTransitions when transitions are forced on", () => {
		const scenes = [
			makeScene({ key: "base" }),
			makeScene({ key: "top", enableTransitions: false }),
		];

		expect(getActiveFloatOverlay(scenes as any, true)).toMatchObject({
			scene: scenes[1],
			overlayIndex: 1,
		});
	});

	it("returns null when no visible overlay exists", () => {
		const scenes = [
			makeScene({ key: "base", overlay: false }),
			makeScene({ key: "top", overlayShown: false }),
		];

		expect(getActiveFloatOverlay(scenes as any, true)).toBeNull();
	});
});
