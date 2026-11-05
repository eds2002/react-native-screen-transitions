import { createModuleMock } from "./helpers/mock-module";
import { afterEach, expect, it } from "bun:test";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

let scene: any = {
	descriptor: {},
	previousDescriptor: undefined,
	nextDescriptor: undefined,
};
const routeKeys = ["A"];
let builderValue = 0;
const sceneListeners = new Set<() => void>();
const listeners = new Set<() => void>();
let motionRenders = 0;
let descendantValue = 0;
let mounts = 0;
const passthrough = ({ children }: { children?: ReactNode }) => children;
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("react-native-gesture-handler", () => ({
	GestureHandlerRootView: passthrough,
}));
await mockModule("react-native-safe-area-context", () => ({
	SafeAreaProvider: passthrough,
	SafeAreaInsetsContext: require("react").createContext(null),
}));
await mockModule("../components/boundary/portal", () => ({
	PortalProvider: passthrough,
}));
await mockModule("../components/overlay", () => ({
	Overlay: () => null,
}));
await mockModule("../navigators/kit/components/lifecycle/scene-lifecycle", () => ({
	SceneLifecycle: () => null,
}));
await mockModule("../navigators/kit/state/navigator-store", () => ({
	useNavigatorStore: (select: (s: any) => unknown) =>
		useSyncExternalStore(
			(callback) => {
				sceneListeners.add(callback);
				return () => {
					sceneListeners.delete(callback);
				};
			},
			() => select({ routeKeys, scenesByKey: { A: scene } }),
		),
}));
await mockModule("../providers/builder", () => ({
	BuilderProvider: passthrough,
}));
await mockModule("../navigators/kit/hooks/use-navigation-helpers", () => ({
	useNavigationHelpers: () => ({ requestDismiss: dismiss }),
}));
const dismiss = () => {};
await mockModule("../providers/motion", () => ({
	MotionProvider: ({ children }: { children: ReactNode }) => {
		motionRenders++;
		return children;
	},
}));
await mockModule("../providers/orchestrator", () => ({
	OrchestratorProvider: passthrough,
}));
await mockModule("../navigators/kit/components/activity", () => ({
	ActivityScreen: passthrough,
	ActivityContainer: passthrough,
}));
await mockModule("../components/screen-layers", () => ({
	ScreenLayers: passthrough,
}));
const { TransitionScenes: BlankStackView } = await import("../navigators/kit/components/scenes");
let renderer: ReactTestRenderer | undefined;
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function Subscriber() {
	useEffect(() => { mounts++; }, []);
	descendantValue = useSyncExternalStore(
		(callback) => {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		},
		() => builderValue,
	);
	return null;
}
it("preserves mounted content and descendant subscriptions when scene descriptors update", () => {
	const children = <Subscriber />;
	const render = (
		child = children,
	) => {
		act(() => {
			scene = { ...scene, descriptor: { ...scene.descriptor, render: () => child } };
			for (const listener of sceneListeners) listener();
			const element = <BlankStackView />;
			if (renderer) renderer.update(element);
			else renderer = create(element);
		});
	};
	render();
	expect(mounts).toBe(1);
	act(() => {
		scene = { ...scene, descriptor: { ...scene.descriptor } };
		for (const listener of sceneListeners) listener();
	});
	expect(mounts).toBe(1);
	act(() => {
		builderValue = 1;
		for (const listener of listeners) listener();
	});
	expect(descendantValue).toBe(1);
	expect(mounts).toBe(1);
	render();
	expect(mounts).toBe(1);
	const next = motionRenders;
	render(<Subscriber />);
	expect(motionRenders).toBeGreaterThan(next);
});
