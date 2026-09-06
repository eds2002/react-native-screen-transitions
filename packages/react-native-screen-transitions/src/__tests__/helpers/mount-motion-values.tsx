import { afterEach } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useMotionValues } from "../../providers/screen/motion/hooks/use-motion-values";
import type { MotionValues } from "../../providers/screen/motion/types";

const renderers: ReactTestRenderer[] = [];
afterEach(() => {
	act(() => {
		for (const renderer of renderers.splice(0)) renderer.unmount();
	});
});

export function mountMotionValues(): MotionValues {
	let values: MotionValues;
	function Fixture() {
		values = useMotionValues();
		return null;
	}
	act(() => {
		renderers.push(create(<Fixture />));
	});
	return values!;
}
