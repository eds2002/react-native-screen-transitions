import { beforeEach, describe, expect, it } from "bun:test";
import { resolveSnapTargetEntry } from "../animation/resolve-snap-target";
import { HistoryStore } from "../stores/history.store";
import type { BaseStackDescriptor } from "../types/stack.types";

type MockNavigation = {
	getState: () => { key: string; routes: Array<{ key: string }>; index: number };
	getParent?: () => MockNavigation | undefined;
	dispatch: (action: any) => void;
	addListener?: (event: any, callback: any) => () => void;
	emit?: (event: any) => any;
};

const createNavigation = (
	key: string,
	parent?: MockNavigation,
): MockNavigation => ({
	getState: () => ({ key, routes: [], index: 0 }),
	getParent: () => parent,
	dispatch: () => {},
	addListener: () => () => {},
	emit: () => {},
});

const createDescriptor = (
	name: string,
	navigation: MockNavigation,
	snapPoints?: number[],
): BaseStackDescriptor =>
	({
		route: { key: `${name}-key`, name },
		navigation,
		options: snapPoints ? { snapPoints } : {},
		render: () => null,
	}) as unknown as BaseStackDescriptor;

beforeEach(() => {
	HistoryStore._reset();
});

describe("snapTo target resolution", () => {
	it("prefers nearest ancestor navigator with snap points", () => {
		const rootNav = createNavigation("root-nav");
		const createNav = createNavigation("create-nav", rootNav);
		const workoutNav = createNavigation("workout-nav", createNav);
		const otherNav = createNavigation("other-nav", rootNav);

		HistoryStore.focus(
			createDescriptor("other-sheet", otherNav, [0.3, 1]),
			"other-nav",
		);
		HistoryStore.focus(
			createDescriptor("create-layout", createNav, [0.5, 1]),
			"create-nav",
		);
		HistoryStore.focus(
			createDescriptor("workout-index", workoutNav),
			"workout-nav",
		);

		const target = resolveSnapTargetEntry();
		expect(target?.descriptor.route.name).toBe("create-layout");
	});

	it("uses latest matching snap screen in the active navigator", () => {
		const rootNav = createNavigation("root-nav");
		const workoutNav = createNavigation("workout-nav", rootNav);

		HistoryStore.focus(
			createDescriptor("workout-layout", workoutNav, [0.25, 0.75, 1]),
			"workout-nav",
		);
		HistoryStore.focus(
			createDescriptor("workout-index", workoutNav),
			"workout-nav",
		);

		const target = resolveSnapTargetEntry();
		expect(target?.descriptor.route.name).toBe("workout-layout");
	});

	it("falls back to global most recent snap screen when lineage has none", () => {
		const rootNav = createNavigation("root-nav");
		const workoutNav = createNavigation("workout-nav", rootNav);
		const otherNav = createNavigation("other-nav", rootNav);

		HistoryStore.focus(
			createDescriptor("other-sheet", otherNav, [0.3, 1]),
			"other-nav",
		);
		HistoryStore.focus(
			createDescriptor("workout-index", workoutNav),
			"workout-nav",
		);

		const target = resolveSnapTargetEntry();
		expect(target?.descriptor.route.name).toBe("other-sheet");
	});

	it("returns undefined when no snap points exist", () => {
		const rootNav = createNavigation("root-nav");
		const workoutNav = createNavigation("workout-nav", rootNav);

		HistoryStore.focus(
			createDescriptor("workout-index", workoutNav),
			"workout-nav",
		);

		const target = resolveSnapTargetEntry();
		expect(target).toBeUndefined();
	});
});
