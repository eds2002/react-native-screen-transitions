import { expect, it } from "bun:test";
import { splitBoundaryLayoutStyle } from "../../components/boundary/root/split-layout-style";

it("gives the placeholder the boundary's box and lets the boundary fill it", () => {
	const { outer, inner } = splitBoundaryLayoutStyle([
		{ width: 169, height: 203, marginTop: 120, alignSelf: "flex-start" },
		{ backgroundColor: "red", borderRadius: 20, padding: 8, transform: [{ scale: 1 }] },
	]);
	expect(outer).toEqual({ width: 169, height: 203, marginTop: 120, alignSelf: "flex-start" });
	expect(inner).toEqual({
		backgroundColor: "red",
		borderRadius: 20,
		padding: 8,
		transform: [{ scale: 1 }],
		width: "auto",
		height: "auto",
		flexGrow: 1,
	});
});

it("moves flex and position, and leaves sizes alone when there are none", () => {
	const { outer, inner } = splitBoundaryLayoutStyle({ flex: 1, position: "absolute", top: 10, left: 4, opacity: 0.5 });
	expect(outer).toEqual({ flex: 1, position: "absolute", top: 10, left: 4 });
	expect(inner).toEqual({ opacity: 0.5, flexGrow: 1 });
});
