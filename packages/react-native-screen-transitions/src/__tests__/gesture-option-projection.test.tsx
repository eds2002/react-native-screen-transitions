import { createModuleMock } from "./helpers/mock-module";
import { afterEach, beforeEach, expect, it } from "bun:test";
import { useLayoutEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ScreenTransitionConfig } from "../types";
import type { ScreenGestureConfig } from "../providers/motion/gestures/types";
import {
	resolveScreenGestureConfig,
	type GesturePolicyOptions,
} from "../providers/motion/gestures/shared/policy";

let options: ScreenTransitionConfig = {};
let isFirstKey = false;
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../providers/builder", () => ({
	useBuilderStore: (select: (value: any) => unknown) =>
		select({ options, derivations: { isFirstKey } }),
}));
const { useScreenGestureConfig } = await import(
	"../providers/motion/gestures/ownership/hooks/use-screen-gesture-config"
);
let config: ScreenGestureConfig;
let publications = 0;
let renderer: ReactTestRenderer | undefined;
function Probe() {
	config = useScreenGestureConfig();
	useLayoutEffect(() => {
		publications++;
	}, [config]);
	return null;
}
function render() {
	act(() => {
		if (renderer) renderer.update(<Probe />);
		else renderer = create(<Probe />);
	});
}
beforeEach(() => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	options = {};
	isFirstKey = false;
	publications = 0;
});
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
});

it("keeps policy identity and consumers stable for fresh equivalent options", () => {
	render();
	const original = config;
	for (let index = 0; index < 3; index++) {
		options = {
			...options,
			screenStyleInterpolator: () => ({}),
			backdropBehavior: index ? "block" : "dismiss",
		};
		render();
		expect(config).toBe(original);
	}
	expect(publications).toBe(1);
});

const changes = {
	gestureDirection: [{ gesture: "horizontal", area: "edge" }],
	gestureEnabled: false,
	gestureTracking: "always",
	gestureReleaseVelocityScale: 0.8,
	gestureSensitivity: 2,
	gestureSnapLocked: true,
	gestureSnapVelocityImpact: 0.7,
	gestureVelocityImpact: 0.6,
	sheetSnapBehavior: "step",
	sheetScrollGestureBehavior: "collapse-only",
	snapPoints: [0.3, "auto", 0.8],
	transitionSpec: { open: { duration: 220 } },
} satisfies Required<GesturePolicyOptions>;

for (const key of Object.keys(changes) as (keyof typeof changes)[]) {
	it(`updates complete policy when ${key} changes`, () => {
		render();
		const before = config;
		options = { ...options, [key]: changes[key] };
		render();
		expect(config).not.toBe(before);
		expect(config).toEqual(resolveScreenGestureConfig({ options, isFirstKey }));
		expect(publications).toBe(2);
		const updated = config;
		options = { ...options };
		render();
		expect(config).toBe(updated);
		expect(publications).toBe(2);
	});
}

it("updates first-screen participation without changing options", () => {
	options = { gestureEnabled: true };
	render();
	const before = config;
	expect(config.participation.canDismiss).toBe(true);
	isFirstKey = true;
	render();
	expect(config).not.toBe(before);
	expect(config.participation.canDismiss).toBe(false);
	expect(config).toEqual(resolveScreenGestureConfig({ options, isFirstKey }));
	expect(publications).toBe(2);
});
