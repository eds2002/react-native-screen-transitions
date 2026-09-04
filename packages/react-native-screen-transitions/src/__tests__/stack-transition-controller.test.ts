import { beforeEach, describe, expect, it } from "bun:test";
import type { BlankStackDescriptor } from "../types/blank-stack.types";
import type {
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
} from "../types/stack.types";

const {
	StackTransitionDriverSignal,
	createStackTransitionController,
	normalizeStackTransitionProgress,
	resolveStackTransitionDismissalBoundary,
	resolveStackTransitionDriverSignal,
} = await import(
	"../providers/stack/stack-transition/stack-transition-controller"
);

const navigation: BaseStackNavigation = {
	dispatch: () => {},
	getState: () => ({ index: 0, key: "stack", routes: [] }),
};

const route = (key: string): BaseStackRoute => ({ key, name: key });

const descriptor = (key: string): BlankStackDescriptor => ({
	navigation,
	options: {},
	route: route(key),
});

const scene = ({
	activity,
	key,
	previous,
}: {
	activity: BaseStackScene<BlankStackDescriptor>["activity"];
	key: string;
	previous?: string;
}): BaseStackScene<BlankStackDescriptor> => {
	const currentDescriptor = descriptor(key);

	return {
		activity,
		descriptor: currentDescriptor,
		previousDescriptor: previous ? descriptor(previous) : undefined,
		route: currentDescriptor.route,
	};
};

const snapshot = (
	scenes: BaseStackScene<BlankStackDescriptor>[],
	focusedIndex: number,
) => ({ focusedIndex, scenes });

const selectionKeys = (
	selection: ReturnType<
		ReturnType<typeof createStackTransitionController>["getSnapshot"]
	>["selection"],
) =>
	selection
		? {
				direction: selection.direction,
				driver: selection.driverRouteKey,
				source: selection.sourceRouteKey,
				target: selection.targetRouteKey,
			}
		: null;

describe("stack transition controller", () => {
	beforeEach(() => {
		(globalThis as any).resetMutableRegistry();
	});

	it("does not invent a transition for the initial stack", () => {
		const controller = createStackTransitionController(
			snapshot([scene({ activity: "active", key: "A" })], 0),
		);

		expect(controller.getSnapshot().selection).toBeNull();
	});

	it("selects the entering route as the forward driver before motion starts", () => {
		const controller = createStackTransitionController(
			snapshot([scene({ activity: "active", key: "A" })], 0),
		);

		controller.update(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "active", key: "B", previous: "A" }),
				],
				1,
			),
		);

		expect(selectionKeys(controller.getSnapshot().selection)).toEqual({
			direction: "forward",
			driver: "B",
			source: "A",
			target: "B",
		});

		controller.handleDriverSignal(StackTransitionDriverSignal.Idle);
		expect(controller.getSnapshot().selection).not.toBeNull();
	});

	it("clears a forward transition only after its driver activates and settles", () => {
		const controller = createStackTransitionController(
			snapshot([scene({ activity: "active", key: "A" })], 0),
		);
		controller.update(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "active", key: "B", previous: "A" }),
				],
				1,
			),
		);

		controller.handleDriverSignal(StackTransitionDriverSignal.Forward);
		controller.handleDriverSignal(StackTransitionDriverSignal.Idle);

		expect(controller.getSnapshot().selection).toBeNull();
	});

	it("selects the retained closing route as the backward driver", () => {
		const controller = createStackTransitionController(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "active", key: "B", previous: "A" }),
				],
				1,
			),
		);

		controller.update(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "closing", key: "B", previous: "A" }),
				],
				0,
			),
		);

		expect(selectionKeys(controller.getSnapshot().selection)).toEqual({
			direction: "backward",
			driver: "B",
			source: "B",
			target: "A",
		});
	});

	it("represents a cancelled back gesture without changing navigation state", () => {
		const stack = snapshot(
			[
				scene({ activity: "inert", key: "A" }),
				scene({ activity: "active", key: "B", previous: "A" }),
			],
			1,
		);
		const controller = createStackTransitionController(stack);

		controller.handleDriverSignal(StackTransitionDriverSignal.Backward);
		expect(selectionKeys(controller.getSnapshot().selection)).toEqual({
			direction: "backward",
			driver: "B",
			source: "B",
			target: "A",
		});

		controller.handleDriverSignal(StackTransitionDriverSignal.Idle);
		expect(controller.getSnapshot().selection).toBeNull();
	});

	it("supersedes an opening route during A to B to C spam", () => {
		const controller = createStackTransitionController(
			snapshot([scene({ activity: "active", key: "A" })], 0),
		);
		controller.update(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "active", key: "B", previous: "A" }),
				],
				1,
			),
		);
		controller.handleDriverSignal(StackTransitionDriverSignal.Forward);

		controller.update(
			snapshot(
				[
					scene({ activity: "inactive", key: "A" }),
					scene({ activity: "inert", key: "B", previous: "A" }),
					scene({ activity: "active", key: "C", previous: "B" }),
				],
				2,
			),
		);

		expect(selectionKeys(controller.getSnapshot().selection)).toEqual({
			direction: "forward",
			driver: "C",
			source: "B",
			target: "C",
		});
	});

	it("reverses the same driver when a route closes while opening", () => {
		const controller = createStackTransitionController(
			snapshot([scene({ activity: "active", key: "A" })], 0),
		);
		controller.update(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "active", key: "B", previous: "A" }),
				],
				1,
			),
		);

		controller.update(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "closing", key: "B", previous: "A" }),
				],
				0,
			),
		);

		expect(selectionKeys(controller.getSnapshot().selection)).toEqual({
			direction: "backward",
			driver: "B",
			source: "B",
			target: "A",
		});
	});

	it("keeps a retained closing selection across equivalent stack updates", () => {
		const closing = snapshot(
			[
				scene({ activity: "inert", key: "A" }),
				scene({ activity: "closing", key: "B", previous: "A" }),
			],
			0,
		);
		const controller = createStackTransitionController(closing);

		controller.handleDriverSignal(StackTransitionDriverSignal.Backward);
		const before = controller.getSnapshot();
		controller.update(closing);

		expect(controller.getSnapshot()).toBe(before);
	});

	it("treats replace as a forward transition from the retained source", () => {
		const controller = createStackTransitionController(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "active", key: "B", previous: "A" }),
				],
				1,
			),
		);

		controller.update(
			snapshot(
				[
					scene({ activity: "inactive", key: "A" }),
					scene({ activity: "inert", key: "B", previous: "A" }),
					scene({ activity: "active", key: "C", previous: "B" }),
				],
				2,
			),
		);

		expect(selectionKeys(controller.getSnapshot().selection)).toEqual({
			direction: "forward",
			driver: "C",
			source: "B",
			target: "C",
		});
	});

	it("targets the revealed route during a multi-pop", () => {
		const controller = createStackTransitionController(
			snapshot(
				[
					scene({ activity: "inactive", key: "A" }),
					scene({ activity: "inert", key: "B", previous: "A" }),
					scene({ activity: "active", key: "C", previous: "B" }),
				],
				2,
			),
		);

		controller.update(
			snapshot(
				[
					scene({ activity: "inert", key: "A" }),
					scene({ activity: "closing", key: "C", previous: "A" }),
				],
				0,
			),
		);

		expect(selectionKeys(controller.getSnapshot().selection)).toEqual({
			direction: "backward",
			driver: "C",
			source: "C",
			target: "A",
		});
	});

	it("normalizes both directions from source zero to target one", () => {
		expect(normalizeStackTransitionProgress("forward", 0.25, 1)).toBe(
			0.25,
		);
		expect(normalizeStackTransitionProgress("backward", 0.25, 1)).toBe(
			0.75,
		);
	});

	it("normalizes navigator progress across the dismissal boundary", () => {
		expect(normalizeStackTransitionProgress("forward", 0.3, 0.6)).toBe(
			0.5,
		);
		expect(normalizeStackTransitionProgress("forward", 0.6, 0.6)).toBe(1);
		expect(normalizeStackTransitionProgress("forward", 1, 0.6)).toBe(1);
		expect(normalizeStackTransitionProgress("backward", 0.3, 0.6)).toBe(
			0.5,
		);
		expect(normalizeStackTransitionProgress("backward", 0, 0.6)).toBe(1);
	});

	it("derives identity signals without copying the driver's progress", () => {
		const idle = {
			closing: 0,
			dismissalBoundary: 1,
			dismissing: 0,
			dragging: 0,
			entering: 0,
			progressBaseline: 1,
			progressSettled: 1,
			settling: 0,
			targetProgress: 1,
			visualProgress: 1,
		};

		expect(
			resolveStackTransitionDriverSignal({ ...idle, entering: 1 }),
		).toBe(StackTransitionDriverSignal.Forward);
		expect(
			resolveStackTransitionDriverSignal({
				...idle,
				closing: 1,
				progressSettled: 0,
				targetProgress: 0,
				visualProgress: 0.4,
			}),
		).toBe(StackTransitionDriverSignal.Backward);
		expect(
			resolveStackTransitionDriverSignal({
				...idle,
				dragging: 1,
				progressSettled: 0,
				visualProgress: 0.7,
			}),
		).toBe(StackTransitionDriverSignal.Backward);
		expect(
			resolveStackTransitionDriverSignal({
				...idle,
				progressSettled: 0,
				settling: 1,
				visualProgress: 0.85,
			}),
		).toBe(StackTransitionDriverSignal.Backward);
		expect(resolveStackTransitionDriverSignal(idle)).toBe(
			StackTransitionDriverSignal.Idle,
		);
	});

	it("keeps local snap motion separate from navigator transitions", () => {
		const dismissalBoundary = resolveStackTransitionDismissalBoundary({
			progressBaseline: 1,
			resolvedAutoSnapPoint: -1,
			snapPoints: [0.6, 1],
		});
		const frame = {
			closing: 0,
			dismissalBoundary,
			dismissing: 0,
			dragging: 1,
			entering: 0,
			progressBaseline: 1,
			progressSettled: 0,
			settling: 0,
			targetProgress: 1,
			visualProgress: 0.8,
		};

		expect(resolveStackTransitionDriverSignal(frame)).toBe(
			StackTransitionDriverSignal.Idle,
		);
		expect(
			resolveStackTransitionDriverSignal({
				...frame,
				visualProgress: 0.5,
			}),
		).toBe(StackTransitionDriverSignal.Backward);
	});
});
