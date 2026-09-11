import { describe, expect, it, mock } from "bun:test";
import { useEffect } from "react";
import { act, create } from "react-test-renderer";

mock.module("react-native", () => ({
	View: "View",
	I18nManager: { isRTL: false },
	StyleSheet: { create: (styles: unknown) => styles },
}));
const store = {
	slotsMap: {
		get: () =>
			({ clip: { style: { x: 30, y: 40, width: 100, height: 120, borderRadius: 8, borderTopLeftRadius: 24, borderBottomEndRadius: 16 } } }) as any,
	},
	screenInterpolatorProps: {
		get: () => ({ layouts: { screen: { width: 390, height: 844 } } }),
	},
};
mock.module(
	"../../providers/screen/orchestrator/orchestrator.provider",
	() => ({
		useOrchestratorStore: (select: (state: typeof store) => unknown) =>
			select(store),
	}),
);
const { Clip } = await import(
	"../../components/screen/container/layers/clip"
);
(
	globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("clipping container layout", () => {
	it("keeps the screen sized before measurement, tracks its host, and never remounts children", () => {
		let mounts = 0;
		function Child() {
			useEffect(() => {
				mounts++;
			}, []);
			return null;
		}
		let renderer: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Clip pointerEvents="box-none">
					<Child />
				</Clip>,
			);
		});
		const innerStyle = () =>
			renderer.root.findAllByType("AnimatedView" as never)[1].props.style[1];
  const viewport = renderer.root.findAllByType("AnimatedView" as never)[0].props.style[1];
  expect(viewport.borderRadius).toBe(8);
  expect(viewport.borderTopLeftRadius).toBe(24);
  expect(viewport.borderBottomEndRadius).toBe(16);
		expect(innerStyle().width).toBe(390);
		expect(innerStyle().height).toBe(844);
		act(() => {
			renderer.root
				.findByType("View" as never)
				.props.onLayout({
					nativeEvent: { layout: { width: 320, height: 500 } },
				});
			renderer.update(
				<Clip pointerEvents="box-none">
					<Child />
				</Clip>,
			);
		});
		expect(innerStyle().width).toBe(320);
		expect(innerStyle().height).toBe(500);
		store.slotsMap.get = () => ({});
		act(() => {
			renderer.update(
				<Clip pointerEvents="box-none">
					<Child />
				</Clip>,
			);
		});
		expect(
			renderer.root.findAllByType("AnimatedView" as never)[0].props.style[1]
				.overflow,
		).toBe("visible");
		expect(innerStyle().width).toBe(320);
		expect(mounts).toBe(1);
		act(() => renderer.unmount());
	});
});
