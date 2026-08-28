import { describe, expect, it, mock } from "bun:test";
import {
	createContext,
	type ComponentType,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	act,
	create,
	type ReactTestRenderer,
} from "react-test-renderer";
import { View } from "react-native";
import { registerTransitionSource } from "../../providers/screen/topology";
import type { ScreenAnimationContextValue } from "../../providers/screen/animation/animation.provider";
import type { ScreenSlotContextValue } from "../../providers/screen/styles/slot.provider";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

const animationStores = new Map<string, ScreenAnimationContextValue>();
const slotStores = new Map<string, ScreenSlotContextValue>();
const ScreenAnimationContext = createContext<ScreenAnimationContextValue | null>(
	null,
);
const ScreenSlotContext = createContext<ScreenSlotContextValue | null>(null);
let stackState: {
	scenes: unknown[];
	focusedIndex: number;
	routeKeys: string[];
	routes: Array<{ key: string; name: string }>;
};

const useScreenAnimationStore = (key?: string | null) => {
	const localStore = useContext(ScreenAnimationContext);
	return typeof key === "string"
		? (animationStores.get(key) ?? null)
		: localStore;
};

const useScreenSlotStore = <Selected,>(
	keyOrSelector?:
		| string
		| null
		| ((store: ScreenSlotContextValue) => Selected),
	selector?: (store: ScreenSlotContextValue) => Selected,
) => {
	const localStore = useContext(ScreenSlotContext);
	const store =
		typeof keyOrSelector === "string"
			? slotStores.get(keyOrSelector)
			: localStore;
	if (!store) {
		return null;
	}

	const resolvedSelector =
		typeof keyOrSelector === "function" ? keyOrSelector : selector;
	return resolvedSelector ? resolvedSelector(store) : store;
};

mock.module("../../providers/stack/blank-stack.provider", () => ({
	useBlankStackStore: () => stackState,
}));

mock.module("../../providers/screen/animation/animation.provider", () => ({
	ScreenAnimationStoreProvider: ({
		children,
		value,
	}: {
		children: ReactNode;
		value: ScreenAnimationContextValue;
	}) => (
		<ScreenAnimationContext.Provider value={value}>
			{children}
		</ScreenAnimationContext.Provider>
	),
	useOptionalScreenAnimationStore: useScreenAnimationStore,
	useScreenAnimationStore,
}));

mock.module("../../providers/screen/animation", () => ({
	ScreenAnimationStoreProvider: ({
		children,
		value,
	}: {
		children: ReactNode;
		value: ScreenAnimationContextValue;
	}) => (
		<ScreenAnimationContext.Provider value={value}>
			{children}
		</ScreenAnimationContext.Provider>
	),
	useOptionalScreenAnimationStore: useScreenAnimationStore,
	useScreenAnimationStore,
}));

mock.module("../../providers/screen/styles/slot.provider", () => ({
	ScreenSlotStoreProvider: ({
		children,
		value,
	}: {
		children: ReactNode;
		value: ScreenSlotContextValue;
	}) => (
		<ScreenSlotContext.Provider value={value}>
			{children}
		</ScreenSlotContext.Provider>
	),
	useOptionalScreenSlotStore: useScreenSlotStore,
	useScreenSlotStore,
}));

const { OverlayHost } = await import(
	"../../components/overlay/variations/overlay-host"
);
const { useScreenAnimation } = await import(
	"../../providers/screen/animation/use-screen-animation"
);
const { useSlotStyles } = await import(
	"../../providers/screen/styles/hooks/slot-resolvers"
);
const Probe = View as ComponentType<Record<string, unknown>>;

const shared = <T,>(value: T) => ({
	value,
	get: () => value,
	set: () => {},
	modify: () => {},
});

const createAnimationStore = (routeKey: string) => {
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
	const screenAnimationSource = {
		boundsAccessor: {},
		screenInterpolatorProps,
	};
	registerTransitionSource(
		routeKey,
		undefined,
		screenAnimationSource as never,
	);
	return {
		screenKey: routeKey,
		screenAnimationSource,
		screenInterpolatorProps,
	} as unknown as ScreenAnimationContextValue;
};

const createSlotStore = (opacity = 0.5) =>
	({
		interpolatorReady: shared(1),
		slotsMap: shared({
			"overlay-probe": {
				style: { opacity },
			},
		}),
		visibilityBlocked: shared(false),
	}) as unknown as ScreenSlotContextValue;

const createScene = (
	key: string,
	overlay?: (props: never) => ReactNode,
) => {
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
		slotStores.clear();

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
		slotStores.set("A", createSlotStore());
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

		animationStores.set("B", createAnimationStore("B"));
		slotStores.set("B", createSlotStore(0.9));
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
		slotStores.clear();

		const scene = createScene("A", (() => null) as never);
		animationStores.set("A", createAnimationStore("A"));
		slotStores.set("A", createSlotStore());
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
