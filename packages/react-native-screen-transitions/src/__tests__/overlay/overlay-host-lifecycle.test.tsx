import { describe, expect, it, mock } from "bun:test";
import {
	createContext,
	type ComponentType,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { View } from "react-native";
import type { OrchestratorState } from "../../providers/screen/orchestrator/orchestrator.provider";

(
	globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const animationStores = new Map<string, OrchestratorState>();
const motionStores = new Map<
	string,
	{ isScreenReady: ReturnType<typeof shared<boolean>> }
>();
const ScreenAnimationContext = createContext<OrchestratorState | null>(null);
let stackState: {
	scenes: unknown[];
	focusedIndex: number;
	routeKeys: string[];
	routes: Array<{ key: string; name: string }>;
};

const useOrchestratorStore = <Selected,>(
	keyOrSelector?: string | null | ((store: OrchestratorState) => Selected),
	selector?: (store: OrchestratorState) => Selected,
) => {
	const localStore = useContext(ScreenAnimationContext);
	const store =
		typeof keyOrSelector === "string"
			? (animationStores.get(keyOrSelector) ?? null)
			: localStore;
	if (!store) return null;

	const resolvedSelector =
		typeof keyOrSelector === "function" ? keyOrSelector : selector;
	return resolvedSelector ? resolvedSelector(store) : store;
};

mock.module("../../providers/screen/motion", () => ({
	getMotionStore: () => {
		throw new Error("Overlay rendering should not request a snap");
	},
	useOptionalMotionStore: (
		keyOrSelector: string | ((store: null) => unknown),
		selector?: (store: {
			isScreenReady: ReturnType<typeof shared<boolean>>;
		}) => unknown,
	) => {
		if (typeof keyOrSelector === "function") return keyOrSelector(null);
		const store = motionStores.get(keyOrSelector);
		return store ? (selector ? selector(store) : store) : null;
	},
}));

mock.module("../../providers/stack/blank-stack.provider", () => ({
	useOptionalBlankStackStore: (selector: (store: null) => unknown) =>
		selector(null),
	useBlankStackStore: () => stackState,
}));

mock.module(
	"../../providers/screen/orchestrator/orchestrator.provider",
	() => ({
		OrchestratorProvider: ({
			children,
			screenKey,
		}: {
			children: ReactNode;
			screenKey: string;
		}) => (
			<ScreenAnimationContext.Provider
				value={animationStores.get(screenKey) ?? null}
			>
				{children}
			</ScreenAnimationContext.Provider>
		),
		useOptionalOrchestratorStore: useOrchestratorStore,
		useOrchestratorStore,
	}),
);

mock.module("../../providers/screen/orchestrator", () => ({
	OrchestratorProvider: ({
		children,
		screenKey,
	}: {
		children: ReactNode;
		screenKey: string;
	}) => (
		<ScreenAnimationContext.Provider
			value={animationStores.get(screenKey) ?? null}
		>
			{children}
		</ScreenAnimationContext.Provider>
	),
	useOptionalOrchestratorStore: useOrchestratorStore,
	useOrchestratorStore,
}));

const { OverlayHost } = await import(
	"../../components/overlay/variations/overlay-host"
);
const { useScreenAnimation } = await import(
	"../../providers/screen/motion/animation/use-screen-animation"
);
const { useSlotStyles } = await import(
	"../../providers/screen/orchestrator/styles/hooks/slot-resolvers"
);
const Probe = View as ComponentType<Record<string, unknown>>;

const shared = <T,>(value: T) => ({
	value,
	get: () => value,
	set: () => {},
	modify: () => {},
});

const createAnimationStore = (routeKey: string, opacity = 0.5) => {
	const screenInterpolatorProps = shared({
		current: {
			gesture: { dismissing: 0, dragging: 0, settling: 0 },
			route: { key: routeKey, name: routeKey },
			layouts: { screen: { width: 390, height: 844 } },
			progress: 1,
			settled: 1,
			transitionProgress: 1,
		},
		insets: { bottom: 0, left: 0, right: 0, top: 0 },
		stackProgress: 1,
	});
	const boundsAccessor = (() => {}) as never;
	return {
		screenInterpolatorProps,
		boundsAccessor,
		slotsMap: shared({ "overlay-probe": { style: { opacity } } }),
	} as unknown as OrchestratorState;
};

const createScene = (key: string, overlay?: (props: never) => ReactNode) => {
	const route = { key, name: key };
	return {
		route,
		activity: "active",
		descriptor: {
			route,
			navigation: {},
			options: { overlay },
		},
	};
};

describe("OverlayHost lifecycle", () => {
	it("keeps the owner component mounted while its driver registers", () => {
		animationStores.clear();
		motionStores.clear();

		let mounts = 0;
		let unmounts = 0;
		let stateInitializations = 0;

		function StatefulOverlay() {
			const [identity] = useState(() => {
				stateInitializations += 1;
				return stateInitializations;
			});
			const animation = useScreenAnimation();
			const animationRouteKey = animation.get().current.route.key;
			const overlayStyle = useSlotStyles("overlay-probe");

			useEffect(() => {
				mounts += 1;
				return () => {
					unmounts += 1;
				};
			}, []);

			return (
				<Probe
					animationRouteKey={animationRouteKey}
					overlayIdentity={identity}
					style={overlayStyle}
					testID="overlay-probe"
				/>
			);
		}

		const sceneA = createScene("A", StatefulOverlay as never);
		const sceneB = createScene("B");
		animationStores.set("A", createAnimationStore("A"));
		motionStores.set("A", { isScreenReady: shared(true) });
		stackState = {
			scenes: [sceneA],
			focusedIndex: 0,
			routeKeys: ["A"],
			routes: [sceneA.route],
		};

		let renderer: ReactTestRenderer;
		act(() => {
			renderer = create(
				<OverlayHost
					driverScene={sceneA as never}
					layerIndex={0}
					scene={sceneA as never}
				/>,
			);
		});

		const initialProbe = renderer!.root.findByProps({
			testID: "overlay-probe",
		});
		expect(initialProbe.props.animationRouteKey).toBe("A");
		expect(initialProbe.props.overlayIdentity).toBe(1);
		expect(initialProbe.props.style).toEqual({ opacity: 0.5 });
		expect(mounts).toBe(1);

		stackState = {
			scenes: [sceneA, sceneB],
			focusedIndex: 1,
			routeKeys: ["A", "B"],
			routes: [sceneA.route, sceneB.route],
		};
		act(() => {
			renderer!.update(
				<OverlayHost
					driverScene={sceneB as never}
					layerIndex={0}
					scene={sceneA as never}
				/>,
			);
		});

		expect(mounts).toBe(1);
		expect(unmounts).toBe(0);
		expect(
			renderer!.root.findByProps({ testID: "overlay-probe" }).props
				.overlayIdentity,
		).toBe(1);

		animationStores.set("B", createAnimationStore("B", 0.9));
		motionStores.set("B", { isScreenReady: shared(true) });
		act(() => {
			renderer!.update(
				<OverlayHost
					driverScene={sceneB as never}
					layerIndex={1}
					scene={sceneA as never}
				/>,
			);
		});

		const registeredProbe = renderer!.root.findByProps({
			testID: "overlay-probe",
		});
		expect(registeredProbe.props.animationRouteKey).toBe("A");
		expect(registeredProbe.props.overlayIdentity).toBe(1);
		expect(registeredProbe.props.style).toEqual({ opacity: 0.5 });
		expect(mounts).toBe(1);
		expect(unmounts).toBe(0);

		act(() => renderer!.unmount());
		expect(unmounts).toBe(1);
	});

	it("defaults the host to pointer-event pass-through", () => {
		animationStores.clear();
		motionStores.clear();

		const scene = createScene("A", (() => null) as never);
		animationStores.set("A", createAnimationStore("A"));
		motionStores.set("A", { isScreenReady: shared(true) });
		stackState = {
			scenes: [scene],
			focusedIndex: 0,
			routeKeys: ["A"],
			routes: [scene.route],
		};

		let renderer: ReactTestRenderer;
		act(() => {
			renderer = create(
				<OverlayHost
					driverScene={scene as never}
					layerIndex={3}
					scene={scene as never}
				/>,
			);
		});

		const host = renderer!.root.findByType("AnimatedView");
		expect(host.props.pointerEvents).toBe("box-none");
		expect(host.props.style).toContainEqual({ zIndex: 1003 });

		act(() => renderer!.unmount());
	});
});
