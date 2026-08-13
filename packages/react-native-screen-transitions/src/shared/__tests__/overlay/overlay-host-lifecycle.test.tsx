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
import type { ScreenAnimationContextValue } from "../../providers/screen/animation/animation.provider";
import type { ScreenSlotContextValue } from "../../providers/screen/styles/slot.provider";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

const animationStores = new Map<string, ScreenAnimationContextValue>();
const slotStores = new Map<string, ScreenSlotContextValue>();
const NavigationContext = createContext<unknown>(undefined);
const NavigationRouteContext = createContext<
	{ key: string; name: string } | undefined
>(undefined);
let stackState: {
	scenes: unknown[];
	focusedIndex: number;
	routeKeys: string[];
	routes: Array<{ key: string; name: string }>;
};

const useScreenAnimationStore = (key: string) =>
	animationStores.get(key) ?? null;

const useScreenSlotStore = <Selected,>(
	key: string,
	selector?: (store: ScreenSlotContextValue) => Selected,
) => {
	const store = slotStores.get(key);
	if (!store) {
		return null;
	}

	return selector ? selector(store) : store;
};

mock.module("../../hooks/navigation/use-stack", () => ({
	useStack: () => stackState,
}));

mock.module("@react-navigation/native", () => ({
	NavigationContext,
	NavigationRouteContext,
	useRoute: () => {
		const route = useContext(NavigationRouteContext);
		if (!route) {
			throw new Error("Navigation route was not provided");
		}
		return route;
	},
}));

mock.module("../../providers/screen/animation/animation.provider", () => ({
	useOptionalScreenAnimationStore: useScreenAnimationStore,
	useScreenAnimationStore,
}));

mock.module("../../providers/screen/animation", () => ({
	useOptionalScreenAnimationStore: useScreenAnimationStore,
	useScreenAnimationStore,
}));

mock.module("../../providers/screen/styles/slot.provider", () => ({
	useOptionalScreenSlotStore: useScreenSlotStore,
	useScreenSlotStore,
}));

mock.module("../../components/overlay/hooks/use-overlay-slot", () => ({
	useOverlaySlot: () => ({ animatedProps: {}, animatedStyle: {} }),
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
				route: { key: routeKey, name: routeKey },
				layouts: { screen: { width: 390, height: 844 } },
			},
			stackProgress: 1,
		});
	const screenInterpolatorPropsRevision = shared(0);

	return {
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		transitionSources: [
			{
				screenInterpolatorProps,
				screenInterpolatorPropsRevision,
				boundsAccessor: {},
			},
		],
		transitionOriginIndex: 0,
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
					activity="active"
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
					activity="active"
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
					activity="active"
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
});
