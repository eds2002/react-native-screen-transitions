import { makeMutable } from "react-native-reanimated";
import { describe, expect, it } from "bun:test";
import { retainReadyOverlayResources } from "../../components/overlay/helpers/retain-ready-overlay-resources";
import type { BaseStackScene as StackScene } from "../../types/stack.types";
import type { OrchestratorState } from "../../providers/screen/orchestrator/orchestrator.provider";

const createScene = (key: string) =>
	({ route: { key, name: key } }) as StackScene;

describe("overlay resource retention", () => {
	const isScreenReady = makeMutable(true);
	it("keeps a mounted overlay alive while the incoming driver registers", () => {
		const sceneA = createScene("A");
		const sceneB = createScene("B");
		const animationA = {} as OrchestratorState;
		const animationB = {} as OrchestratorState;
		const mounted = retainReadyOverlayResources(
			null,
			animationA,
			sceneA,
			animationA,
			isScreenReady,
		);

		const whileBRegisters = retainReadyOverlayResources(
			mounted,
			animationA,
			sceneB,
			null,
			isScreenReady,
		);
		const drivenByB = retainReadyOverlayResources(
			whileBRegisters,
			animationA,
			sceneB,
			animationB,
			isScreenReady,
		);

		expect(whileBRegisters).toBe(mounted);
		expect(drivenByB).toEqual({
			overlayAnimationStore: animationA,
			driverScene: sceneB,
			driverAnimationStore: animationB,
			driverIsScreenReady: isScreenReady,
		});
	});

	it("never drops mounted resources during a transient owner-store gap", () => {
		const scene = createScene("A");
		const animation = {} as OrchestratorState;
		const mounted = retainReadyOverlayResources(
			null,
			animation,
			scene,
			animation,
			isScreenReady,
		);

		expect(
			retainReadyOverlayResources(mounted, null, scene, animation, isScreenReady),
		).toBe(mounted);
	});

	it("waits for complete resources before the first mount", () => {
		expect(
			retainReadyOverlayResources(
				null,
				null,
				createScene("A"),
				null,
				isScreenReady,
			),
		).toBeNull();
	});
});
