import { useMotionValues } from "../providers/screen/motion/hooks/use-motion-values";
import { afterEach, expect, it, mock } from "bun:test";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSharedValue } from "react-native-reanimated";
import { useTransitionValues } from "../providers/screen/motion/hooks/use-transition-values";
import { screenTopology } from "../providers/screen/builder/topology/helpers/create-screen-topology";
import { NO_GESTURE_OWNERS } from "../providers/screen/motion/gestures/types";
import { NO_CLAIMS } from "../types/ownership.types";
import { ScrollStore } from "../stores/scroll.store";

const BuilderContext = createContext<any>(null);
const MotionContext = createContext<any>(null);
mock.module("../providers/screen/builder", () => ({
	useBuilderStore: (selector: (state: any) => unknown) =>
		selector(useContext(BuilderContext)),
	useOptionalBuilderStore: () => null,
}));
mock.module("../providers/screen/motion", () => ({
	useMotionStore: (selector: ((state: any) => unknown) | readonly string[]) =>
		Array.isArray(selector)
			? []
			: (selector as (state: any) => unknown)(useContext(MotionContext)),
	useOptionalMotionStore: () => null,
}));
mock.module("../providers/stack/blank-stack.provider", () => ({
	useBlankStackStore: (selector: (state: any) => unknown) =>
		selector({ routeKeys: [], scenesByKey: {} }),
	useOptionalBlankStackStore: (selector: (state: any) => unknown) =>
		selector(null),
}));
mock.module("../providers/stack/core.provider", () => ({
	useStackCoreStore: (selector: (state: any) => unknown) =>
		selector({ flags: { TRANSITIONS_ALWAYS_ON: true } }),
	useOptionalStackCoreStore: (selector: (state: any) => unknown) =>
		selector(null),
}));
mock.module("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
}));
const { useMotionAnimationPipeline } = await import(
	"../providers/screen/motion/animation/pipeline"
);
const { useScreenOptions } = await import(
	"../providers/screen/motion/options/use-screen-options"
);
const {
	OrchestratorProvider,
	useOrchestratorStore,
	useOptionalOrchestratorStore,
} = await import("../providers/screen/orchestrator/orchestrator.provider");
const { useSlotStyles, useSlotProps } = await import(
	"../providers/screen/orchestrator/styles/hooks/slot-resolvers"
);

const parentKey = "slots-parent";
const childKey = "slots-child";
let showChildStyle = true;
const parentOptions = {
	screenStyleInterpolator: () => ({
		inherited: { opacity: 0.3 },
		content: { opacity: 0.1 },
	}),
};
const childOptions = {
	screenStyleInterpolator: () =>
		showChildStyle
			? {
					custom: { style: { opacity: 0.4 }, props: { pointerEvents: "none" } },
					content: {
						style: { opacity: 0.7 },
						props: { pointerEvents: "none" },
					},
				}
			: {},
};
function Builder({
	screenKey,
	children,
}: {
	screenKey: string;
	children?: ReactNode;
}) {
	const descriptor = useMemo(
		() => ({
			route: { key: screenKey, name: screenKey },
			options: screenKey === parentKey ? parentOptions : childOptions,
		}),
		[screenKey],
	);
	return (
		<BuilderContext.Provider
			value={{
				descriptors: { current: descriptor },
				options: descriptor.options,
				derivations: { currentScreenKey: screenKey },
			}}
		>
			<Motion>{children}</Motion>
		</BuilderContext.Provider>
	);
}
function Motion({ children }: { children?: ReactNode }) {
	const {
		derivations: { currentScreenKey },
	} = useContext(BuilderContext);
	const animations = useMotionAnimationPipeline(useMotionValues());
	const visibilityBlocked = useSharedValue(false);
	const options = useScreenOptions();
	const owners = useSharedValue({ ...NO_GESTURE_OWNERS });
	const gestures = useMemo(
		() => ({
			routeKey: currentScreenKey,
			owners,
			claimedDirections: NO_CLAIMS,
		}),
		[currentScreenKey, owners],
	);
	return (
		<MotionContext.Provider
			value={{ state: animations, options, gestures, visibilityBlocked }}
		>
			<OrchestratorProvider>{children}</OrchestratorProvider>
		</MotionContext.Provider>
	);
}
let local: ReturnType<typeof useOrchestratorStore>;
let remote: ReturnType<typeof useOptionalOrchestratorStore>;
let inheritedStyle: unknown;
let contentStyle: unknown;
let contentProps: unknown;
function LocalProbe() {
	local = useOrchestratorStore();
	inheritedStyle = useSlotStyles("inherited");
	contentStyle = useSlotStyles("content");
	contentProps = useSlotProps("content");
	return null;
}
function RemoteProbe() {
	remote = useOptionalOrchestratorStore(childKey);
	return null;
}
let renderer: ReactTestRenderer | undefined;
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	for (const key of [parentKey, childKey]) {
		screenTopology.unregister(key);
		ScrollStore.clearBag(key);
	}
});

it("provides inherited slots and resets without Blank Stack or Stack Core context", () => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	screenTopology.register({ screenKey: parentKey });
	screenTopology.register({ screenKey: childKey, parentScreenKey: parentKey });
	const tree = () => (
		<>
			<RemoteProbe />
			<Builder screenKey={parentKey}>
				<Builder screenKey={childKey}>
					<LocalProbe />
				</Builder>
			</Builder>
		</>
	);
	act(() => {
		renderer = create(tree());
	});
	expect(remote?.slotsMap).toBe(local.slotsMap);
	expect(inheritedStyle).toEqual({ opacity: 0.3 });
	expect(contentStyle).toEqual({ opacity: 0.7 });
	expect(contentProps).toEqual({ pointerEvents: "none" });
	expect(remote?.screenInterpolatorProps.get().current.route.key).toBe(
		childKey,
	);

	showChildStyle = false;
	// The test Reanimated shim evaluates on every get(), so observe the reset
	// patch before subsequent readers consume the next resolved frame.
	const reset = local.slotsMap.get().custom;
	expect(reset.style).toEqual({ opacity: 1 });
	expect(reset.props).toEqual({ pointerEvents: "auto" });
	act(() => {
		renderer!.update(tree());
	});
	expect(contentStyle).toEqual({});
	expect(contentProps).toEqual({});
	expect(inheritedStyle).toEqual({ opacity: 0.3 });
	act(() => {
		renderer!.update(<RemoteProbe />);
	});
	expect(remote).toBeNull();
});
