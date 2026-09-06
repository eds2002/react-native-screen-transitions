import { MotionProvider, getMotionStore } from "../../providers/screen/motion";
import { screenTopology } from "../../providers/screen/builder/topology/helpers/create-screen-topology";
import { snapDescriptorToIndex } from "../../animation/snap-to";
import { Activity, useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LifecycleTransitionRequestKind } from "../../providers/screen/builder/hooks/use-builder-animation-state";

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
	hasStack = true;
});

// Exercise Builder readiness with Motion, without mounting slots.
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
const readBuilder = () => useBuilderStore();
type BuilderState = ReturnType<typeof readBuilder>;
let renderer: ReactTestRenderer | undefined;
let local: BuilderState;
let remote: BuilderState | null;

function LocalProbe() {
	local = useBuilderStore();
	return null;
}
function RemoteProbe() {
	remote = useOptionalBuilderStore("builder-child");
	return null;
}

function BlockParent() {
	const state = useBuilderStore((store) => store.animationState);
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

describe("BuilderProvider", () => {
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
		expect(getBuilderStore("builder-child").animationState).toBe(
			local.animationState,
		);
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

		const system = local.animationState;
		system.actions.requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			1,
		);
		system.actions.blockLifecycleStart();
		expect(local.descriptors.current).toBe(scenes["builder-child"].descriptor);
		expect(local.options).toBe(scenes["builder-child"].descriptor.options);
		expect(local.derivations.currentScreenKey).toBe("builder-child");
		expect(remote?.screenReady).toBe(local.screenReady);
		expect(remote?.screenReady.get()).toBe(0);
		expect(renderer!.root.findAllByType("AnimatedView")).toHaveLength(1);

		system.pendingLifecycleStartBlockCount.set(0);
		expect(local.screenReady.get()).toBe(0);
		system.animationProgress.set(0.01);
		expect(remote?.screenReady.get()).toBe(1);
		getMotionStore("builder-child").state.closing.set(1);
		system.animationProgress.set(0);
		expect(remote?.screenReady.get()).toBe(0);
	});

	it("inherits a parent's visibility block while remaining ready itself", () => {
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

		expect(local.screenReady.get()).toBe(1);
		expect(local.visibilityBlocked.get()).toBe(true);
		const wrappers = renderer!.root.findAllByType("AnimatedView");
		expect(wrappers).toHaveLength(2);
		expect(wrappers[1].props.style[1]).toEqual({
			transform: [{ translateY: 0 }],
		});
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
		const state = local.animationState;
		state.targetProgress.set(0.4);
		act(() => {
			renderer!.update(render());
		});
		expect(local.animationState).toBe(state);
		expect(getBuilderStore("builder-child").animationState).toBe(state);
		expect(state.targetProgress.get()).toBe(0.4);
		act(() => {
			renderer!.unmount();
		});
		renderer = undefined;
		expect(() => getBuilderStore("builder-child")).toThrow("unavailable");
		act(() => {
			renderer = create(render());
		});
		expect(local.animationState).not.toBe(state);
		expect(local.animationState.targetProgress.get()).toBe(1);
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
		const state = local.animationState;
		state.targetProgress.set(0.6);
		state.measuredContentLayout.set({ width: 200, height: 300 });
		act(() => {
			renderer!.update(render("hidden"));
		});
		act(() => {
			renderer!.update(render("visible"));
		});
		expect(local.animationState).toBe(state);
		expect(getBuilderStore("builder-child").animationState).toBe(state);
		expect(state.targetProgress.get()).toBe(0.6);
		expect(state.measuredContentLayout.get()).toEqual({
			width: 200,
			height: 300,
		});
	});

	it("snaps using the mounted builder's measured auto point and animation values", () => {
		act(() => {
			renderer = create(
				<BuilderProvider routeKey="builder-child">
					<LocalProbe />
				</BuilderProvider>,
			);
		});
		const state = local.animationState;
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
