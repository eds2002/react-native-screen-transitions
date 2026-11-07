import { expect, it } from "bun:test";
import { act, create } from "react-test-renderer";
import {
	resolveSizedAxes,
	usePlaceholderStyles,
} from "../../components/boundary/portal/hooks/use-placeholder-styles";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it("an axis the style sizes is not pinned; an aspect ratio sizes the other axis", () => {
	expect(resolveSizedAxes({ width: 171.5, height: 137.2 })).toEqual({ width: true, height: true });
	expect(resolveSizedAxes([{ width: 100 }, { height: "auto" }])).toEqual({ width: true, height: false });
	expect(resolveSizedAxes({ width: "50%", aspectRatio: 1.25 })).toEqual({ width: true, height: true });
	expect(resolveSizedAxes({ flex: 1, aspectRatio: 1 })).toEqual({ width: false, height: false });
	expect(resolveSizedAxes(undefined)).toEqual({ width: false, height: false });
});

const layoutEvent = (width: number, height: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height } } }) as any;

const renderPlaceholder = async (sized: { width: boolean; height: boolean }) => {
	let output: ReturnType<typeof usePlaceholderStyles> | undefined;
	function Probe({ pinned }: { pinned: boolean }) {
		output = usePlaceholderStyles(pinned, sized);
		return null;
	}
	let root: ReturnType<typeof create>;
	await act(() => {
		root = create(<Probe pinned={false} />);
	});
	// Laid out on the pixel grid: a 171.5 pt card is 171.67 pt wide at 3x.
	await act(() => output!.handleOnLayout(layoutEvent(171.6667, 137.3333)));
	await act(() => root!.update(<Probe pinned />));
	const style = output!.placeholderStyle;
	await act(() => root!.unmount());
	return style;
};

it("a boundary sized by its style keeps its style's size once measured (no pixel-rounded pin)", async () => {
	expect(await renderPlaceholder({ width: true, height: true })).toBeUndefined();
});

it("a content-sized boundary pins the axes its content gave it", async () => {
	expect(await renderPlaceholder({ width: false, height: false })).toEqual({ width: 171.6667, height: 137.3333 });
	expect(await renderPlaceholder({ width: true, height: false })).toEqual({ height: 137.3333 });
});
