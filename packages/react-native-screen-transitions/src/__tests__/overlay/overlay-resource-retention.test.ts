import { makeMutable } from "react-native-reanimated";
import { describe, expect, it } from "bun:test";
import { retainReadyOverlayResources } from "../../components/overlay/helpers/retain-ready-overlay-resources";
import type { BaseStackScene as StackScene } from "../../types/stack.types";
import type { OrchestratorState } from "../../providers/screen/orchestrator/orchestrator.provider";

const createScene = (key: string) =>
	({ route: { key, name: key } }) as StackScene;

describe("overlay resource retention", () => {
	const screenReady = makeMutable(1);
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
			screenReady,
		);

		const whileBRegisters = retainReadyOverlayResources(
			mounted,
			animationA,
			sceneB,
			null,
			screenReady,
		);
		const drivenByB = retainReadyOverlayResources(
			whileBRegisters,
			animationA,
			sceneB,
			animationB,
			screenReady,
		);

		expect(whileBRegisters).toBe(mounted);
		expect(drivenByB).toEqual({
			overlayAnimationStore: animationA,
			driverScene: sceneB,
			driverAnimationStore: animationB,
			driverScreenReady: screenReady,
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
			screenReady,
		);

		expect(
			retainReadyOverlayResources(mounted, null, scene, animation, screenReady),
		).toBe(mounted);
	});

	it("waits for complete resources before the first mount", () => {
		expect(
			retainReadyOverlayResources(
				null,
				null,
				createScene("A"),
				null,
				screenReady,
			),
		).toBeNull();
	});
});
