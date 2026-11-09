import { createModuleMock } from "./helpers/mock-module";
import { afterEach, expect, it } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import createProvider from "../utils/create-provider";

const { OrchestratorProvider, useOptionalOrchestratorStore } = createProvider("Orchestrator", { global: true })<{
  children: React.ReactNode;
  id: string;
}, { screenInterpolatorProps: { get: () => { current: { progress: number } } }; boundsAccessor: object }>(({ id }) => ({
  key: id,
  value: { screenInterpolatorProps: { get: () => ({ current: { progress: 0.5 } }) }, boundsAccessor: {} },
}));
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../providers/orchestrator/orchestrator.store", () => ({ useOptionalOrchestratorStore }));
await mockModule("../providers/builder", () => ({ useOptionalBuilderStore: (selector: (value: null) => unknown) => selector(null) }));
await mockModule("../providers/builder/topology", () => ({ useResolvedTransitionKey: (_: unknown, target: unknown) => typeof target === "string" ? target : null }));
await mockModule("react-native-reanimated", () => ({ useDerivedValue: (read: () => unknown) => ({ get: read }) }));
const { useScreenAnimation } = await import("../providers/motion/animation/use-screen-animation");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let renderer: ReactTestRenderer | undefined;
let animation: { get: () => any };
afterEach(() => { act(() => renderer?.unmount()); renderer = undefined; });
function Observer({ target }: { target?: string }) {
  animation = target ? useScreenAnimation(target) : useScreenAnimation();
  return null;
}
it("observes a targeted sibling outside screen context, including registration and removal", () => {
  act(() => { renderer = create(<Observer target="screen" />); });
  expect(animation.get()).toBeNull();
  act(() => { renderer!.update(<><Observer target="screen" /><OrchestratorProvider id="screen">{null}</OrchestratorProvider></>); });
  expect(animation.get().current.progress).toBe(0.5);
  act(() => { renderer!.update(<Observer target="screen" />); });
  expect(animation.get()).toBeNull();
});
it("still requires screen context for an untargeted observation", () => {
  expect(() => act(() => { renderer = create(<Observer />); })).toThrow("requires a screen context");
});
it("preserves untargeted observations inside a screen", () => {
  act(() => { renderer = create(<OrchestratorProvider id="local"><Observer /></OrchestratorProvider>); });
  expect(animation.get().current.progress).toBe(0.5);
});
