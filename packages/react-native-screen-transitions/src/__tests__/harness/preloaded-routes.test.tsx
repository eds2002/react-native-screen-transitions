import { expect, it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { HarnessOverlay, mountStack, SCREEN_MARKER, SCROLL_MARKER } =
	await import("./stack-harness");
const { getMotionStore } = await import("../../providers/motion");
const { BoundStore } = await import("../../stores/bounds");
const { ScrollStore } = await import("../../stores/scroll.store");

it("prepares a hidden scene and opens the same subtree at its measured snap point", async () => {
	const stack = await mountStack(sim, {
		screens: [
			{ name: "A" },
			{
				name: "B",
				scroll: { contentSize: 1200 },
				bounds: [{ id: "card", rect: { x: 20, y: 20, width: 80, height: 80 } }],
				options: {
					snapPoints: ["auto"],
					overlay: HarnessOverlay,
					transitionSpec: { open: { duration: 100 } },
				},
			},
		],
	});
	try {
		await stack.settle();
		await stack.js(() => stack.ref.preload("B"));
		await stack.settle();
		const frame = stack.record();
		const screen = frame.scenes.find((scene) => scene.name === "B");
		if (!screen) throw new Error("Preloaded scene was not mounted");

		expect(screen.opacity).toBe(0);
		expect(screen.touchable).toBe(false);
		expect(frame.scenes.find((scene) => scene.name === "A")?.touchable).toBe(true);
		expect(frame.overlays).toEqual([]);
		expect(stack.focusedPath()).toEqual(["A"]);
		expect(BoundStore.entry.get("card", screen.key)).toBeNull();
		expect(ScrollStore.peekBag(screen.key)).toBeUndefined();

		const marker = stack.renderer.root.findByProps({
			testID: `${SCREEN_MARKER}${screen.key}:B`,
		});
		let layout = marker.parent;
		while (layout && typeof layout.props.onLayout !== "function") {
			layout = layout.parent;
		}
		if (!layout) throw new Error("Preloaded scene cannot measure content");
		const measure = layout.props.onLayout;
		const scroll = stack.renderer.root.find(
			(node) =>
				typeof node.type === "string" &&
				node.props.testID === `${SCROLL_MARKER}${screen.key}`,
		);
		await stack.js(() =>
			measure({ nativeEvent: { layout: { width: stack.window.width, height: 320 } } }),
		);
		await stack.js(() => scroll.props.onContentSizeChange(stack.window.width, 1200));
		await stack.settle();

		const motion = getMotionStore(screen.key).state;
		const target = 320 / stack.window.height;
		expect(motion.resolvedAutoSnapPoint.get()).toBeCloseTo(target);
		expect(motion.transitionProgress.get()).toBe(0);
		expect(motion.pendingLifecycleRequestKind.get()).toBe(0);

		await stack.navigate("B");
		await stack.settle();
		expect(stack.routes().at(-1)?.key).toBe(screen.key);
		expect(stack.renderer.root.findByProps({ testID: marker.props.testID })).toBe(marker);
		expect(stack.record().scenes.find((scene) => scene.key === screen.key)?.opacity).toBe(1);
		expect(motion.transitionProgress.get()).toBeCloseTo(target);
		expect(BoundStore.entry.get("card", screen.key)).not.toBeNull();
		expect(ScrollStore.getValue(screen.key, "metadata").get()?.vertical).toMatchObject({
			layoutSize: stack.window.height,
			contentSize: 1200,
		});
	} finally {
		await stack.unmount();
	}
});

it("discards an evicted preload without changing the active scene", async () => {
	const stack = await mountStack(sim, { screens: [{ name: "A" }, { name: "B" }] });
	try {
		await stack.settle();
		const activeKey = stack.routes()[0]?.key;
		await stack.js(() => stack.ref.preload("B"));
		await stack.settle();
		const preload = stack.record().scenes.find((scene) => scene.name === "B");
		if (!preload) throw new Error("Preloaded scene was not mounted");
		await stack.js(() =>
			stack.ref.resetRoot({
				...stack.ref.getRootState(),
				preloadedRoutes: [],
			} as ReturnType<typeof stack.ref.getRootState>),
		);
		await stack.settle();
		expect(stack.record().scenes.map(({ key }) => key)).toEqual([activeKey]);
		expect(ScrollStore.peekBag(preload.key)).toBeUndefined();
	} finally {
		await stack.unmount();
	}
});

it("reuses a preloaded replacement and retires the outgoing root", async () => {
	const stack = await mountStack(sim, { screens: [{ name: "A" }, { name: "B" }] });
	try {
		await stack.settle();
		await stack.js(() => stack.ref.preload("B"));
		await stack.settle();
		const preload = stack.record().scenes.find((scene) => scene.name === "B");
		if (!preload) throw new Error("Preloaded scene was not mounted");
		const marker = stack.renderer.root.findByProps({
			testID: `${SCREEN_MARKER}${preload.key}:B`,
		});
		await stack.replace("B");
		await stack.settle();
		expect(stack.record().scenes.map(({ key }) => key)).toEqual([preload.key]);
		expect(stack.renderer.root.findByProps({ testID: marker.props.testID })).toBe(marker);
	} finally {
		await stack.unmount();
	}
});
