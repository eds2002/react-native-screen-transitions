import { afterEach } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
	useTransitionValues,
	type MotionTransitionValues,
} from "../../providers/screen/motion/hooks/use-transition-values";

const renderers: ReactTestRenderer[] = [];
afterEach(() => {
	act(() => {
		for (const renderer of renderers.splice(0)) renderer.unmount();
	});
});

export function mountMotionTransitionValues(): MotionTransitionValues {
	let state: MotionTransitionValues;
	function Fixture() {
		state = useTransitionValues();
		return null;
	}
	act(() => {
		renderers.push(create(<Fixture />));
	});
	return state!;
}
