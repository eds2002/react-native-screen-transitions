import { afterEach, expect, it, mock } from "bun:test";
import { useSyncExternalStore } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { makeMutable } from "react-native-reanimated";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Real useSyncExternalStore semantics: changing unrelated snapshots must not
// wake a boundary whose selected motion handles remain unchanged.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};
function useSelection<T, S>(read: () => T, selector: (value: T) => S) {
	return useSyncExternalStore(subscribe, () => selector(read()));
}
let stack = { scenes: [] as { activity: string; route: { key: string } }[] };
let destinationPairKey: string | undefined;
const actions = { blockLifecycleStart() {}, unblockLifecycleStart() {} };
let state = {
	actions,
	transitionProgress: makeMutable(0),
	willAnimate: makeMutable(0),
	progressSettled: makeMutable(1),
	closing: makeMutable(0),
	route: { key: "home" },
};
mock.module("../../providers/stack/blank-stack.provider", () => ({
	useBlankStackStore: <T,>(selector: (value: typeof stack) => T) =>
		useSelection(() => stack, selector),
}));
mock.module("../../providers/screen/builder", () => ({
	useBuilderStore: <T,>(
		selector: (value: {
			derivations: {
				currentScreenKey: string;
				nextScreenKey?: string;
				destinationPairKey?: string;
			};
		}) => T,
	) =>
		selector({ derivations: { currentScreenKey: "home", destinationPairKey } }),
}));
mock.module("../../providers/screen/motion", () => ({
	useMotionStore: <T,>(selector: (value: { state: typeof state }) => T) =>
		useSelection(
			() => state,
			(current) => selector({ state: current }),
		),
	useOptionalMotionStore: <T,>(
		_key: string | null,
		selector: (value: { state: typeof state }) => T,
	) =>
		useSelection(
			() => state,
			(current) => selector({ state: current }),
		),
}));
const { useInitialDestinationMeasurement } = await import(
	"../../components/boundary/hooks/lifecycles/use-initial-destination-measurement"
);
const { useRefreshBoundary } = await import(
	"../../components/boundary/hooks/lifecycles/use-refresh-boundary"
);
const boundTag = { tag: "asset", linkKey: "asset" };
let renderer: ReactTestRenderer | undefined;
let renders = 0;
function DestinationProbe() {
	renders++;
	useInitialDestinationMeasurement({
		boundTag,
		enabled: true,
		measureBoundary() {},
	});
	return null;
}
function RefreshProbe() {
	renders++;
	useRefreshBoundary({ boundTag, enabled: true, measureBoundary() {} });
	return null;
}
function update(change: () => void) {
	act(() => {
		change();
		for (const notify of listeners) notify();
	});
}
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	renders = 0;
	destinationPairKey = undefined;
	stack = { scenes: [] };
});

it("source-only boundaries ignore unrelated stack scene updates", () => {
	act(() => {
		renderer = create(<DestinationProbe />);
	});
	const initial = renders;
	update(() => {
		stack = { scenes: [{ activity: "active", route: { key: "settings" } }] };
	});
	expect(renders).toBe(initial);
});

it("destination lifecycles ignore unrelated route metadata but observe actions", () => {
	act(() => {
		renderer = create(<DestinationProbe />);
	});
	const initial = renders;
	update(() => {
		state = { ...state, route: { key: "home" } };
	});
	expect(renders).toBe(initial);
	update(() => {
		state = { ...state, actions: { ...actions } };
	});
	expect(renders).toBeGreaterThan(initial);
});

it("eligible destinations still observe closing source changes", () => {
	destinationPairKey = "source<>home";
	act(() => {
		renderer = create(<DestinationProbe />);
	});
	const initial = renders;
	update(() => {
		stack = { scenes: [{ activity: "closing", route: { key: "source" } }] };
	});
	expect(renders).toBeGreaterThan(initial);
});

it("refresh lifecycles ignore route metadata but observe changed motion handles", () => {
	act(() => {
		renderer = create(<RefreshProbe />);
	});
	const initial = renders;
	update(() => {
		state = { ...state, route: { key: "home" } };
	});
	expect(renders).toBe(initial);
	update(() => {
		state = { ...state, closing: makeMutable(0) };
	});
	expect(renders).toBeGreaterThan(initial);
});

it("tracks scenes when a boundary becomes a destination and stops when it is covered", () => {
	act(() => {
		renderer = create(<DestinationProbe />);
	});
	act(() => {
		destinationPairKey = "source<>home";
		renderer!.update(<DestinationProbe />);
	});
	const receivingRenders = renders;
	update(() => {
		stack = { scenes: [{ activity: "closing", route: { key: "source" } }] };
	});
	expect(renders).toBeGreaterThan(receivingRenders);
	act(() => {
		destinationPairKey = undefined;
		renderer!.update(<DestinationProbe />);
	});
	const coveredRenders = renders;
	update(() => {
		stack = { scenes: [] };
	});
	expect(renders).toBe(coveredRenders);
});
