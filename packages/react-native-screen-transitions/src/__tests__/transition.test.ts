import { describe, expect, it } from "bun:test";
import { transition } from "../animation/transition";
import { screenTopology } from "../providers/screen/topology/helpers/create-screen-topology";
import type { ScreenTransitionSource } from "../types/bounds.types";

const createSource = (routeKey: string): ScreenTransitionSource => {
	type Frame = ReturnType<
		ScreenTransitionSource["screenInterpolatorProps"]["get"]
	>;
	let frame = {
		current: { route: { key: routeKey } },
	} as Frame;
	const listeners = new Map<number, (value: Frame) => void>();

	return {
		screenInterpolatorProps: {
			get: () => frame,
			set: (value: Frame | ((current: Frame) => Frame)) => {
				frame = typeof value === "function" ? value(frame) : value;
				for (const listener of listeners.values()) listener(frame);
			},
			addListener: (id: number, listener: (value: Frame) => void) => {
				listeners.set(id, listener);
			},
			removeListener: (id: number) => {
				listeners.delete(id);
			},
		} as ScreenTransitionSource["screenInterpolatorProps"],
		boundsAccessor: { id: routeKey } as never,
	};
};

describe("transition", () => {
	it("reads an exact globally keyed screen source", () => {
		const source = createSource("feed-route");
		screenTopology.register({ screenKey: "feed-route", transitionKey: "feed" });
		screenTopology.registerTransitionSource("feed-route", source);

		expect(transition("feed")?.get()?.current.route.key).toBe("feed-route");

		screenTopology.unregisterTransitionSource("feed-route");
		screenTopology.unregister("feed-route");
		expect(transition("feed")).toBeNull();
	});

	it("reads updated keyed frames without replacing the source", () => {
		const source = createSource("feed-opening");
		screenTopology.register({
			screenKey: "feed-route",
			transitionKey: "feed-updating",
		});
		screenTopology.registerTransitionSource("feed-route", source);
		const frame = {
			current: { route: { key: "feed-settled" } },
		} as ReturnType<typeof source.screenInterpolatorProps.get>;

		source.screenInterpolatorProps.set(frame);

		expect(transition("feed-updating")?.get()?.current.route.key).toBe(
			"feed-settled",
		);
		screenTopology.unregisterTransitionSource("feed-route");
		screenTopology.unregister("feed-route");
	});
});
