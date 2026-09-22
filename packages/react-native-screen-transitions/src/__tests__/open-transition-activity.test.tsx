import { createModuleMock } from "./helpers/mock-module";
import { afterEach, expect, it, mock } from "bun:test";
import { Activity, useLayoutEffect } from "react";
import { makeMutable } from "react-native-reanimated";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../providers/builder", () => ({
	useBuilderStore: (selector: (store: any) => unknown) =>
		selector({ derivations: { isFirstKey: false } }),
}));
const { useOpenTransitionIntent } = await import(
	"../navigators/blank-stack/components/lifecycle/hooks/use-open-transition-intent"
);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let renderer: ReactTestRenderer | undefined;
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
});

it("preserves retained motion on Activity resume and initializes a genuine remount", () => {
	const request = mock(() => {});
	const entering = makeMutable(0);
	const progress = makeMutable(0);
	const closing = makeMutable(0);
	let effectSetups = 0;
	const current = { options: {} } as any;
	const animations = { entering, closing, transitionProgress: progress } as any;
	const system = {
		animationProgress: progress,
		actions: { requestLifecycleTransition: request },
	} as any;
	function Screen() {
		useLayoutEffect(() => {
			effectSetups++;
		}, []);
		useOpenTransitionIntent(current, animations, system);
		return null;
	}
	const tree = (mode: "visible" | "hidden", key = "retained") => (
		<Activity mode={mode}>
			<Screen key={key} />
		</Activity>
	);
	act(() => {
		renderer = create(tree("visible"));
	});
	expect(request).toHaveBeenCalledTimes(1);
	entering.set(0);
	progress.set(0.6);
	act(() => renderer!.update(tree("hidden")));
	act(() => renderer!.update(tree("visible")));
	expect(effectSetups).toBe(2);
	expect(request).toHaveBeenCalledTimes(1);
	expect(entering.get()).toBe(0);
	expect(progress.get()).toBe(0.6);
	act(() => renderer!.update(tree("visible", "new-instance")));
	expect(request).toHaveBeenCalledTimes(2);
	expect(entering.get()).toBe(1);
});

it.each([
	{
		name: "interrupted opening",
		entering: 1,
		closing: 0,
		settled: 0,
		pending: 0,
		resumes: true,
	},
	{
		name: "pending close",
		entering: 1,
		closing: 0,
		settled: 0,
		pending: 2,
		resumes: false,
	},
	{
		name: "pending open",
		entering: 1,
		closing: 0,
		settled: 0,
		pending: 1,
		resumes: false,
	},
	{
		name: "closing motion",
		entering: 1,
		closing: 1,
		settled: 0,
		pending: 0,
		resumes: false,
	},
	{
		name: "settled opening",
		entering: 1,
		closing: 0,
		settled: 1,
		pending: 0,
		resumes: false,
	},
])("resumes only an unfinished open without replacing $name", (state) => {
	const request = mock(() => {});
	const entering = makeMutable(0);
	const closing = makeMutable(0);
	const progressSettled = makeMutable(1);
	const progress = makeMutable(0);
	const targetProgress = makeMutable(0.8);
	const pendingLifecycleRequestKind = makeMutable(0);
	const pendingLifecycleStartBlockCount = makeMutable(1);
	const animations = {
		entering,
		closing,
		progressSettled,
		transitionProgress: progress,
	} as any;
	const system = {
		animationProgress: progress,
		targetProgress,
		pendingLifecycleRequestKind,
		pendingLifecycleStartBlockCount,
		actions: { requestLifecycleTransition: request },
	} as any;
	function Screen() {
		useOpenTransitionIntent({ options: {} } as any, animations, system);
		return null;
	}
	const tree = (mode: "visible" | "hidden") => (
		<Activity mode={mode}>
			<Screen />
		</Activity>
	);
	act(() => {
		renderer = create(tree("visible"));
	});
	request.mockClear();
	entering.set(state.entering);
	closing.set(state.closing);
	progressSettled.set(state.settled);
	progress.set(0.6);
	pendingLifecycleRequestKind.set(state.pending);
	act(() => renderer!.update(tree("hidden")));
	act(() => renderer!.update(tree("visible")));
	expect(request).toHaveBeenCalledTimes(state.resumes ? 1 : 0);
	if (state.resumes) expect(request).toHaveBeenCalledWith(1, 0.8);
	expect(progress.get()).toBe(0.6);
	expect(targetProgress.get()).toBe(0.8);
	expect(pendingLifecycleStartBlockCount.get()).toBe(1);
	expect(pendingLifecycleRequestKind.get()).toBe(state.pending);
});
