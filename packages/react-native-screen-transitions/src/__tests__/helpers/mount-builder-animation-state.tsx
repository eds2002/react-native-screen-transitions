import { afterEach } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useBuilderAnimationState, type BuilderAnimationState } from "../../providers/screen/builder/hooks/use-builder-animation-state";

const renderers: ReactTestRenderer[] = [];
afterEach(() => {
	act(() => { for (const renderer of renderers.splice(0)) renderer.unmount(); });
});

export function mountBuilderAnimationState(): BuilderAnimationState {
	let state: BuilderAnimationState;
	function Fixture() { state = useBuilderAnimationState(); return null; }
	act(() => { renderers.push(create(<Fixture />)); });
	return state!;
}
