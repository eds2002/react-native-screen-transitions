import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";
import { type ComponentType, type ReactNode, useState } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ScrollGestureCoordination } from "../providers/screen/motion/gestures/ownership/gesture-ownership-coordinator";
import { ScrollStore } from "../stores/scroll.store";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ROUTE_KEY = "scrollable-source";
const ANCESTOR_ROUTE_KEY = "scrollable-ancestor";
const EMPTY_COORDINATION: ScrollGestureCoordination = {
	panGestures: [],
	pinchGestures: [],
	scrollStates: [],
	ownerRouteKeys: [],
};
let gestureContext: { routeKey: string } | null = { routeKey: ROUTE_KEY };
let coordination = EMPTY_COORDINATION;

mock.module("../providers/screen/motion", () => ({
	useMotionStore: () => [],
	useOptionalMotionStore: (selector: (store: unknown) => unknown) =>
		selector(gestureContext ? { gestures: gestureContext } : null),
}));
mock.module(
	"../providers/screen/motion/gestures/ownership/use-gesture-scroll-coordination",
	() => ({
		useGestureScrollCoordination: () => coordination,
	}),
);
mock.module("../providers/screen/orchestrator/styles", () => ({
	useSlotStyles: () => ({}),
	useSlotProps: () => ({}),
}));

let TransitionScrollView: ComponentType<{
	children?: ReactNode;
	revision?: number;
}>;
let renderer: ReactTestRenderer | undefined;

beforeAll(async () => {
	const { createTransitionAwareComponent } = await import(
		"../components/create-transition-aware-component"
	);
	TransitionScrollView = createTransitionAwareComponent(
		"ScrollView" as unknown as ComponentType<{
			children?: ReactNode;
			revision?: number;
		}>,
		{ isScrollable: true },
	);
});

beforeEach(() => {
	globalThis.resetMutableRegistry();
	gestureContext = { routeKey: ROUTE_KEY };
	coordination = EMPTY_COORDINATION;
});

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	ScrollStore.clearBag(ROUTE_KEY);
	ScrollStore.clearBag(ANCESTOR_ROUTE_KEY);
});

describe("scrollable gesture ownership lifecycle", () => {
	it("preserves child state and captured boundary measurement as owners register, pause, and resume", () => {
		const capturedMeasurement = {
			pairKey: "source<>destination",
			bounds: { x: 18, y: 320, pageX: 18, pageY: 320, width: 354, height: 250 },
		};
		let mounts = 0;
		let observed:
			| {
					mount: number;
					value: string;
					setValue: (value: string) => void;
					measurement: SharedValue<typeof capturedMeasurement | null>;
			  }
			| undefined;
		function StatefulBoundaryPayload() {
			const [mount] = useState(() => ++mounts);
			const [value, setValue] = useState("initial");
			// BoundaryRootProvider keeps its source measurement in this same
			// component-local primitive; a subtree remount discards the capture.
			const measurement = useSharedValue<typeof capturedMeasurement | null>(
				null,
			);
			observed = { mount, value, setValue, measurement };
			return <>{value}</>;
		}
		const render = (revision: number) => (
			<TransitionScrollView revision={revision}>
				<StatefulBoundaryPayload />
			</TransitionScrollView>
		);
		act(() => {
			renderer = create(render(0));
		});
		const original = observed!;
		act(() => {
			original.setValue("edited payload");
			original.measurement.set(capturedMeasurement);
		});
		const registeredOwners: ScrollGestureCoordination = {
			panGestures: [
				{ name: "local-pan" } as never,
				{ name: "ancestor-pan" } as never,
			],
			pinchGestures: [
				{ name: "local-pinch" } as never,
				{ name: "ancestor-pinch" } as never,
			],
			scrollStates: [
				ScrollStore.getValue(ROUTE_KEY, "coordination"),
				ScrollStore.getValue(ANCESTOR_ROUTE_KEY, "coordination"),
			],
			ownerRouteKeys: [ROUTE_KEY, ANCESTOR_ROUTE_KEY],
		};

		for (const [index, owners] of [
			registeredOwners,
			EMPTY_COORDINATION,
			registeredOwners,
		].entries()) {
			coordination = owners;
			act(() => renderer?.update(render(index + 1)));
			expect(observed?.mount).toBe(original.mount);
			expect(observed?.value).toBe("edited payload");
			expect(observed?.measurement.get()).toEqual(capturedMeasurement);
			const gestureConfig =
				renderer!.root.findByType(GestureDetector).props.gesture.config;
			expect(gestureConfig.requireToFail ?? []).toEqual(
				owners.panGestures.map((gesture) => ({ current: gesture })),
			);
			expect(gestureConfig.simultaneousHandlers ?? []).toEqual(
				owners.pinchGestures.map((gesture) => ({ current: gesture })),
			);
		}
		expect(mounts).toBe(1);
	});

	it("keeps an ordinary scroll view outside transition context free of gesture detectors", () => {
		gestureContext = null;
		act(() => {
			renderer = create(
				<TransitionScrollView>ordinary content</TransitionScrollView>,
			);
		});
		expect(renderer!.root.findAllByType(GestureDetector)).toHaveLength(0);
		expect(renderer!.root.findByType("ScrollView").props.children).toBe(
			"ordinary content",
		);
	});
});
