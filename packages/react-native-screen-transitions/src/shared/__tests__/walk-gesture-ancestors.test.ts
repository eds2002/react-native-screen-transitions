import { describe, expect, it } from "bun:test";
import { walkGestureAncestors } from "../providers/screen/gestures/helpers/walk-gesture-ancestors";

type TestGestureContext = {
	label: string;
	isIsolated: boolean;
	gestureContext: TestGestureContext | null;
};

describe("walkGestureAncestors", () => {
	it("walks ancestors while isolation matches", () => {
		const root: TestGestureContext = {
			label: "root",
			isIsolated: false,
			gestureContext: null,
		};
		const parent: TestGestureContext = {
			label: "parent",
			isIsolated: false,
			gestureContext: root,
		};

		expect(walkGestureAncestors(parent, false).map((node) => node.label)).toEqual(
			["parent", "root"],
		);
	});

	it("stops when an ancestor crosses a stack isolation boundary", () => {
		const root: TestGestureContext = {
			label: "root",
			isIsolated: true,
			gestureContext: null,
		};
		const parent: TestGestureContext = {
			label: "parent",
			isIsolated: false,
			gestureContext: root,
		};

		expect(walkGestureAncestors(parent, false).map((node) => node.label)).toEqual(
			["parent"],
		);
	});
});
