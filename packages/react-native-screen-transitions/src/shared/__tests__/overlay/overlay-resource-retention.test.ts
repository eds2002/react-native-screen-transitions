import { describe, expect, it } from "bun:test";
import type { FloatOverlayEntry } from "../../components/overlay/helpers/get-active-overlay";
import { retainReadyOverlayResources } from "../../components/overlay/helpers/retain-ready-overlay-resources";
import type { ScreenAnimationContextValue } from "../../providers/screen/animation/animation.provider";
import type { ScreenSlotContextValue } from "../../providers/screen/styles/slot.provider";

const createScene = (key: string) =>
	({ route: { key, name: key } }) as FloatOverlayEntry["scene"];

describe("overlay resource retention", () => {
	it("keeps a mounted overlay alive while the incoming driver registers", () => {
		const sceneA = createScene("A");
		const sceneB = createScene("B");
		const animationA = {} as ScreenAnimationContextValue;
		const animationB = {} as ScreenAnimationContextValue;
		const slotsA = {} as ScreenSlotContextValue;
		const slotsB = {} as ScreenSlotContextValue;
		const mounted = retainReadyOverlayResources(
			null,
			animationA,
			sceneA,
			animationA,
			slotsA,
		);

		const whileBRegisters = retainReadyOverlayResources(
			mounted,
			animationA,
			sceneB,
			null,
			null,
		);
		const drivenByB = retainReadyOverlayResources(
			whileBRegisters,
			animationA,
			sceneB,
			animationB,
			slotsB,
		);

		expect(whileBRegisters).toBe(mounted);
		expect(drivenByB).toEqual({
			overlayAnimationStore: animationA,
			driverScene: sceneB,
			driverAnimationStore: animationB,
			driverSlots: slotsB,
		});
	});

	it("never drops mounted resources during a transient owner-store gap", () => {
		const scene = createScene("A");
		const animation = {} as ScreenAnimationContextValue;
		const slots = {} as ScreenSlotContextValue;
		const mounted = retainReadyOverlayResources(
			null,
			animation,
			scene,
			animation,
			slots,
		);

		expect(
			retainReadyOverlayResources(mounted, null, scene, animation, slots),
		).toBe(mounted);
	});

	it("waits for complete resources before the first mount", () => {
		expect(
			retainReadyOverlayResources(
				null,
				null,
				createScene("A"),
				null,
				null,
			),
		).toBeNull();
	});
});
