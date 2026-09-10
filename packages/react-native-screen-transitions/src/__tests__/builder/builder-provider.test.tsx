import {
	MotionProvider,
	getMotionStore,
	useMotionStore,
	useOptionalMotionStore,
} from "../../providers/screen/motion";
import { screenTopology } from "../../providers/screen/builder/topology/helpers/create-screen-topology";
import { snapDescriptorToIndex } from "../../animation/snap-to";
import { Activity, useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LifecycleTransitionRequestKind } from "../../providers/screen/motion/hooks/use-transition-values";
import { useContentLayout } from "../../components/screen/container/hooks/use-content-layout";
import { getVisibilityBlockOffset } from "../../utils/visibility-block-offset";

const scenes = Object.fromEntries(
	["builder-parent", "builder-child"].map((key) => [
		key,
		{
			route: { key, name: key },
			activity: "active",
			descriptor: {
				route: { key, name: key },
				options: {
					screenStyleInterpolator: () => ({ content: { opacity: 1 } }),
				},
				navigation: { getState: () => ({ routes: [{ key }] }) },
			},
		},
	]),
);

let hasStack = true;
mock.module("../../providers/stack/blank-stack.provider", () => ({
	useOptionalBlankStackStore: (selector: (store: any) => unknown) =>
		selector(
			hasStack
				? {
						navigatorKey: "builder-test-navigator",
						scenesByKey: scenes,
						scenes: Object.values(scenes),
						focusedIndex: 1,
					}
				: null,
		),
}));
beforeEach(() => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	hasStack = true;
});

// Exercise Builder topology and Motion readiness together, without slots.
const {
	BuilderProvider: PrimitiveBuilderProvider,
	useBuilderStore,
	useOptionalBuilderStore,
	getBuilderStore,
} = await import("../../providers/screen/builder/builder.provider");
function BuilderProvider({
	routeKey,
	children,
}: {
	routeKey: string;
	children?: React.ReactNode;
}) {
	return (
		<PrimitiveBuilderProvider
			routeKey={routeKey}
			descriptors={{ current: scenes[routeKey].descriptor as never }}
		>
			<MotionProvider>{children}</MotionProvider>
		</PrimitiveBuilderProvider>
	);
}
const readBuilder = () => ({ ...useMotionStore(), ...useBuilderStore() });
type BuilderState = ReturnType<typeof readBuilder>;
let renderer: ReactTestRenderer | undefined;
let local: BuilderState;
let remote: BuilderState | null;

function LocalProbe() {
	local = { ...useMotionStore(), ...useBuilderStore() };
	return null;
}
function RemoteProbe() {
	const builder = useOptionalBuilderStore("builder-child");
	const motion = useOptionalMotionStore("builder-child");
	remote = builder && motion ? { ...motion, ...builder } : null;
	return null;
}

function BlockParent() {
	const state = useMotionStore((store) => store.state);
	useLayoutEffect(() => {
		state.actions.requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			1,
		);
		state.actions.blockLifecycleStart();
	}, [state]);
	return null;
}

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
});

describe("Builder and Motion composition", () => {
	it("keeps whole-content auto sizing when no measurement target is configured", () => {
		const key = "builder-child";
		const originalOptions = scenes[key].descriptor.options;
		let measure: ReturnType<typeof useContentLayout>;
		function MeasurementProbe() {
			measure = useContentLayout("content");
			return <LocalProbe />;
		}
		try {
			scenes[key].descriptor.options = { ...originalOptions, snapPoints: ["auto", 1] } as typeof originalOptions;
			act(() => {
				renderer = create(<BuilderProvider routeKey={key}><MeasurementProbe /></BuilderProvider>);
			});
			act(() => measure?.({ nativeEvent: { layout: { width: 390, height: 500 } } } as never));
			expect(local.state.resolvedAutoSnapPoint.get()).toBeCloseTo(500 / 844);
			expect(local.state.targetProgress.get()).toBeCloseTo(500 / 844);
		} finally {
			scenes[key].descriptor.options = originalOptions;
		}
	});

	it("sizes auto from the tagged container height while retaining the full content layout", () => {
		const key = "builder-child";
		const originalOptions = scenes[key].descriptor.options;
		let measureContent: ReturnType<typeof useContentLayout>;
		let measureTarget: ReturnType<typeof useContentLayout>;
		let measureOther: ReturnType<typeof useContentLayout>;
		function MeasurementProbe() {
			measureContent = useContentLayout("content");
			measureTarget = useContentLayout("profile-header");
			measureOther = useContentLayout("other");
			return <LocalProbe />;
		}
		const layout = (height: number) => ({
			nativeEvent: { layout: { x: 0, y: 200, width: 390, height } },
		});
		try {
			scenes[key].descriptor.options = {
				...originalOptions,
				snapPoints: ["profile-header", 1],
			} as typeof originalOptions;
			act(() => {
				renderer = create(<BuilderProvider routeKey={key}><MeasurementProbe /></BuilderProvider>);
			});
			act(() => measureContent(layout(700) as never));
			expect(local.state.measuredContentLayout.get()).toEqual({ width: 390, height: 700 });
			expect(local.state.resolvedAutoSnapPoint.get()).toBe(-1);
			act(() => measureOther?.(layout(500) as never));
			expect(local.state.resolvedAutoSnapPoint.get()).toBe(-1);
			act(() => measureTarget(layout(300) as never));
			expect(local.state.resolvedAutoSnapPoint.get()).toBeCloseTo(300 / 844);
			expect(local.state.targetProgress.get()).toBeCloseTo(300 / 844);
			expect(local.state.measuredContentLayout.get()?.height).toBe(700);
			act(() => measureTarget(layout(400) as never));
			expect(local.state.resolvedAutoSnapPoint.get()).toBeCloseTo(400 / 844);
			act(() => measureTarget(layout(1000) as never));
			expect(local.state.resolvedAutoSnapPoint.get()).toBe(1);
			act(() => measureTarget(layout(0) as never));
			expect(local.state.resolvedAutoSnapPoint.get()).toBe(1);
		} finally {
			scenes[key].descriptor.options = originalOptions;
		}
	});

	it("skips topology registration without Blank Stack while keeping Builder state available", () => {
		hasStack = false;
		act(() => {
			renderer = create(
				<BuilderProvider routeKey="builder-parent">
					<BuilderProvider routeKey="builder-child">
						<LocalProbe />
					</BuilderProvider>
				</BuilderProvider>,
			);
		});
		expect(local.derivations.currentScreenKey).toBe("builder-child");
		expect(getMotionStore("builder-child").state).toBe(local.state);
		expect(
			screenTopology.getRelationships("builder-child").parentScreenKey,
		).toBeNull();
		expect(
			screenTopology.getRelationships("builder-parent").activeChildScreenKey,
		).toBeNull();
	});

	it("exposes the same readiness through context and key lookup before slots exist", () => {
		act(() => {
			renderer = create(
				<>
					<RemoteProbe />
					<BuilderProvider routeKey="builder-child">
						<LocalProbe />
					</BuilderProvider>
				</>,
			);
		});

		const system = local.state;
		system.actions.requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			1,
		);
		system.actions.blockLifecycleStart();
		expect(local.descriptors.current).toBe(scenes["builder-child"].descriptor);
		expect(local.options).toBe(scenes["builder-child"].descriptor.options);
		expect(local.derivations.currentScreenKey).toBe("builder-child");
		expect(remote?.isScreenReady).toBe(local.isScreenReady);
		expect(remote?.isScreenReady.get()).toBe(false);
		expect(renderer!.root.findAllByType("AnimatedView")).toHaveLength(1);

		system.pendingLifecycleStartBlockCount.set(0);
		expect(local.isScreenReady.get()).toBe(false);
		system.animationProgress.set(0.01);
		expect(remote?.isScreenReady.get()).toBe(true);
		getMotionStore("builder-child").state.closing.set(1);
		system.animationProgress.set(0);
		expect(remote?.isScreenReady.get()).toBe(false);
	});

	it("remains unready while its parent is blocked without applying a second offset", () => {
		act(() => {
			renderer = create(
				<BuilderProvider routeKey="builder-parent">
					<BlockParent />
					<BuilderProvider routeKey="builder-child">
						<LocalProbe />
					</BuilderProvider>
				</BuilderProvider>,
			);
		});

		expect(local.isScreenReady.get()).toBe(false);
		const wrappers = renderer!.root.findAllByType("AnimatedView");
		expect(wrappers).toHaveLength(2);
		expect(wrappers[1].props.style[1]).toEqual({
			opacity: 1,
			transform: [{ translateY: 0 }],
		});

		const parent = getMotionStore("builder-parent").state;
		parent.pendingLifecycleStartBlockCount.set(0);
		expect(local.isScreenReady.get()).toBe(false);
		parent.animationProgress.set(0.01);
		act(() => {
			renderer!.update(
				<BuilderProvider routeKey="builder-parent">
					<BuilderProvider routeKey="builder-child">
						<LocalProbe />
					</BuilderProvider>
				</BuilderProvider>,
			);
		});
		expect(local.isScreenReady.get()).toBe(true);
	});

	it("keeps local opening checks after the visibility gate has already opened", () => {
		const tree = () => (
			<BuilderProvider routeKey="builder-child">
				<LocalProbe />
			</BuilderProvider>
		);
		act(() => {
			renderer = create(tree());
		});
		local.state.animationProgress.set(1);
		act(() => {
			renderer!.update(tree());
		});
		expect(local.isScreenReady.get()).toBe(true);

		local.state.actions.requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			1,
		);
		local.state.animationProgress.set(0);
		act(() => {
			renderer!.update(tree());
		});
		expect(local.isScreenReady.get()).toBe(false);
		expect(
			renderer!.root.findByType("AnimatedView").props.style[1].transform,
		).toEqual([{ translateY: getVisibilityBlockOffset(844) }]);

		local.state.actions.blockLifecycleStart();
		local.state.animationProgress.set(0.01);
		expect(local.isScreenReady.get()).toBe(false);
		local.state.actions.unblockLifecycleStart();
		expect(local.isScreenReady.get()).toBe(true);
	});

	it.each([
		"builder-parent",
		"builder-child",
	])("becomes unready after %s closes and applies only one offset", (closingKey) => {
		const tree = () => (
			<BuilderProvider routeKey="builder-parent">
				<BuilderProvider routeKey="builder-child">
					<LocalProbe />
				</BuilderProvider>
			</BuilderProvider>
		);
		act(() => {
			renderer = create(tree());
		});
		const closing = getMotionStore(closingKey).state;
		closing.closing.set(1);
		closing.animationProgress.set(0.01);
		expect(local.isScreenReady.get()).toBe(true);
		closing.animationProgress.set(0);
		expect(local.isScreenReady.get()).toBe(false);
		act(() => {
			renderer!.update(tree());
		});

		const wrappers = renderer!.root.findAllByType("AnimatedView");
		const closedIndex = closingKey === "builder-parent" ? 0 : 1;
		expect(wrappers[closedIndex].props.style[1]).toEqual({
			opacity: 0,
			transform: [{ translateY: getVisibilityBlockOffset(844) }],
		});
		expect(wrappers[1 - closedIndex].props.style[1]).toEqual({
			opacity: 1,
			transform: [{ translateY: 0 }],
		});
		expect(wrappers[1].props.animatedProps.pointerEvents).toBe("none");
	});

	it("keeps values on rerender and releases the registered state on unmount", () => {
		const render = () => (
			<BuilderProvider routeKey="builder-child">
				<LocalProbe />
			</BuilderProvider>
		);
		act(() => {
			renderer = create(render());
		});
		const state = local.state;
		state.targetProgress.set(0.4);
		act(() => {
			renderer!.update(render());
		});
		expect(local.state).toBe(state);
		expect(getMotionStore("builder-child").state).toBe(state);
		expect(state.targetProgress.get()).toBe(0.4);
		act(() => {
			renderer!.unmount();
		});
		renderer = undefined;
		expect(() => getBuilderStore("builder-child")).toThrow("unavailable");
		act(() => {
			renderer = create(render());
		});
		expect(local.state).not.toBe(state);
		expect(local.state.targetProgress.get()).toBe(1);
	});

	it("preserves values across React Activity hiding and showing", () => {
		const render = (mode: "visible" | "hidden") => (
			<Activity mode={mode}>
				<BuilderProvider routeKey="builder-child">
					<LocalProbe />
				</BuilderProvider>
			</Activity>
		);
		act(() => {
			renderer = create(render("visible"));
		});
		const state = local.state;
		state.targetProgress.set(0.6);
		state.measuredContentLayout.set({ width: 200, height: 300 });
		act(() => {
			renderer!.update(render("hidden"));
		});
		act(() => {
			renderer!.update(render("visible"));
		});
		expect(local.state).toBe(state);
		expect(getMotionStore("builder-child").state).toBe(state);
		expect(state.targetProgress.get()).toBe(0.6);
		expect(state.measuredContentLayout.get()).toEqual({
			width: 200,
			height: 300,
		});
	});

	it("snaps using the mounted Motion provider's measured auto point and animation values", () => {
		act(() => {
			renderer = create(
				<BuilderProvider routeKey="builder-child">
					<LocalProbe />
				</BuilderProvider>,
			);
		});
		const state = local.state;
		state.resolvedAutoSnapPoint.set(0.6);
		const originalRaf = globalThis.requestAnimationFrame;
		globalThis.requestAnimationFrame = (callback) => {
			callback(0);
			return 1;
		};
		try {
			expect(
				snapDescriptorToIndex(
					{
						...local.descriptors.current,
						options: {
							snapPoints: [0.25, "auto", 1],
							transitionSpec: { expand: { duration: 0 } },
						},
					},
					1,
				),
			).toBe(true);
			expect(state.targetProgress.get()).toBe(0.6);
			expect(state.animationProgress.get()).toBe(0.6);
		} finally {
			globalThis.requestAnimationFrame = originalRaf;
		}
	});

	it("registers nested relationships and removes them with Builder", () => {
		act(() => {
			renderer = create(
				<BuilderProvider routeKey="builder-parent">
					<BuilderProvider routeKey="builder-child">
						<LocalProbe />
					</BuilderProvider>
				</BuilderProvider>,
			);
		});
		expect(
			screenTopology.getRelationships("builder-child").parentScreenKey,
		).toBe("builder-parent");
		expect(
			screenTopology.getRelationships("builder-parent").activeChildScreenKey,
		).toBe("builder-child");
		expect(
			screenTopology.getRelationships("builder-parent").activeChildNavigatorKey,
		).toBe("builder-test-navigator");
		expect(screenTopology.resolve("builder-parent", 1)).toBe("builder-child");
		act(() => {
			renderer!.unmount();
		});
		renderer = undefined;
		expect(
			screenTopology.getRelationships("builder-parent").activeChildScreenKey,
		).toBeNull();
		expect(
			screenTopology.getRelationships("builder-child").parentScreenKey,
		).toBeNull();
	});
});
