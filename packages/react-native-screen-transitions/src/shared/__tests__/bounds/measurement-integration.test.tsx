import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import React, { Fragment, useEffect, useMemo, useRef } from "react";
import { cleanup, render } from "@testing-library/react-native";
import { useAutoSourceMeasurement } from "../../components/create-boundary-component/hooks/use-auto-source-measurement";
import { useBoundaryMeasureAndStore } from "../../components/create-boundary-component/hooks/use-boundary-measure-and-store";
import { useGroupActiveMeasurement } from "../../components/create-boundary-component/hooks/use-group-active-measurement";
import { useGroupActiveSourceMeasurement } from "../../components/create-boundary-component/hooks/use-group-active-source-measurement";
import { BoundStore } from "../../stores/bounds";

type MutableValue<T> = {
	value: T;
	get(): T;
	set(next: T | ((current: T) => T)): void;
	modify(modifier?: (current: T) => T): void;
	_isReanimatedSharedValue: true;
};

const cloneMutableValue = <T,>(value: T): T => {
	if (typeof value !== "object" || value === null) {
		return value;
	}

	return JSON.parse(JSON.stringify(value));
};

const createMutableValue = <T,>(initialValue: T): MutableValue<T> => {
	let current = cloneMutableValue(initialValue);

	const mutable: MutableValue<T> = {
		get value() {
			return current;
		},
		set value(next: T) {
			current = next;
		},
		get() {
			return current;
		},
		set(next: T | ((current: T) => T)) {
			current =
				typeof next === "function" ? (next as (current: T) => T)(current) : next;
		},
		modify(modifier) {
			current = modifier ? modifier(current) : current;
		},
		_isReanimatedSharedValue: true,
	};

	return mutable;
};

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const measuredTags: string[] = [];

const createMeasurement = () => ({
	x: 0,
	y: 0,
	pageX: 0,
	pageY: 0,
	width: 120,
	height: 80,
});

const createMeasureRef = (tag: string) => ({
	current: {
		tag,
		measurement: createMeasurement(),
	},
});

const MeasureHarness = (props: {
	tag: string;
	currentScreenKey: string;
	intent: "complete-destination" | "refresh-destination";
	trigger: number;
}) => {
	const { tag, currentScreenKey, intent, trigger } = props;
	const animatedRef = useRef(createMeasureRef(tag)).current as any;
	const isAnimating = useRef(createMutableValue(0)).current as any;
	const layoutAnchor = useMemo(
		() => ({
			correctMeasurement: (measured: ReturnType<typeof createMeasurement>) =>
				measured,
			isMeasurementInViewport: () => true,
		}),
		[],
	);

	const maybeMeasureAndStore = useBoundaryMeasureAndStore({
		enabled: true,
		sharedBoundTag: tag,
		currentScreenKey,
		ancestorKeys: [],
		isAnimating,
		preparedStyles: {},
		animatedRef,
		layoutAnchor,
	});

	useEffect(() => {
		if (trigger === 0) return;
		maybeMeasureAndStore({ intent });
	}, [intent, maybeMeasureAndStore, trigger]);

	return null;
};

const AutoSourceHarness = (props: {
	tag: string;
	currentScreenKey: string;
	nextScreenKey: string;
	tick: number;
}) => {
	const { tag, currentScreenKey, nextScreenKey, tick: _tick } = props;
	const animatedRef = useRef(createMeasureRef(tag)).current as any;
	const isAnimating = useRef(createMutableValue(0)).current as any;
	const layoutAnchor = useMemo(
		() => ({
			correctMeasurement: (measured: ReturnType<typeof createMeasurement>) =>
				measured,
			isMeasurementInViewport: () => true,
		}),
		[],
	);

	const maybeMeasureAndStore = useBoundaryMeasureAndStore({
		enabled: true,
		sharedBoundTag: tag,
		currentScreenKey,
		ancestorKeys: [],
		isAnimating,
		preparedStyles: {},
		animatedRef,
		layoutAnchor,
	});

	useAutoSourceMeasurement({
		enabled: true,
		sharedBoundTag: tag,
		nextScreenKey,
		maybeMeasureAndStore,
	});

	return null;
};

const GroupDestinationHarness = (props: {
	id: string;
	tick: number;
	calls: string[];
}) => {
	const { id, tick: _tick, calls } = props;
	const isAnimating = useRef(createMutableValue(0)).current as any;

	useGroupActiveMeasurement({
		enabled: true,
		group: "photos",
		id,
		shouldUpdateDestination: true,
		isAnimating,
		maybeMeasureAndStore: () => {
			calls.push(id);
		},
	});

	return null;
};

const GroupSourceHarness = (props: {
	id: string;
	tick: number;
	calls: string[];
	isAnimating: MutableValue<number>;
}) => {
	const { id, tick: _tick, calls, isAnimating } = props;

	useGroupActiveSourceMeasurement({
		enabled: true,
		group: "photos",
		id,
		hasNextScreen: true,
		isAnimating: isAnimating as any,
		maybeMeasureAndStore: () => {
			calls.push(id);
		},
	});

	return null;
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
	globalThis.__reanimatedMeasureSpy = (
		ref: { current?: { tag?: string; measurement?: any } } | undefined,
	) => {
		const tag = ref?.current?.tag;
		if (tag) {
			measuredTags.push(tag);
		}
	};
	measuredTags.length = 0;
});

describe("bounds measurement integration", () => {
	it("measures only the boundary with a matching pending destination link", () => {
		BoundStore.setLinkSource("photos:2", "list", createMeasurement());

		render(
			<Fragment>
				<MeasureHarness
					tag="photos:1"
					currentScreenKey="detail"
					intent="complete-destination"
					trigger={1}
				/>
				<MeasureHarness
					tag="photos:2"
					currentScreenKey="detail"
					intent="complete-destination"
					trigger={1}
				/>
				<MeasureHarness
					tag="photos:3"
					currentScreenKey="detail"
					intent="complete-destination"
					trigger={1}
				/>
			</Fragment>,
		);

		expect(measuredTags).toEqual(["photos:2"]);
	});

	it("measures only the grouped member with an active destination link", () => {
		BoundStore.setLinkSource("photos:2", "list", createMeasurement());
		BoundStore.setLinkDestination("photos:2", "detail", createMeasurement());

		render(
			<Fragment>
				<MeasureHarness
					tag="photos:1"
					currentScreenKey="detail"
					intent="refresh-destination"
					trigger={1}
				/>
				<MeasureHarness
					tag="photos:2"
					currentScreenKey="detail"
					intent="refresh-destination"
					trigger={1}
				/>
				<MeasureHarness
					tag="photos:3"
					currentScreenKey="detail"
					intent="refresh-destination"
					trigger={1}
				/>
			</Fragment>,
		);

		expect(measuredTags).toEqual(["photos:2"]);
	});

	it("auto-captures source only for the boundary whose destination becomes present", () => {
		const tree = (
			<Fragment>
				<AutoSourceHarness
					tag="photos:1"
					currentScreenKey="list"
					nextScreenKey="detail"
					tick={0}
				/>
				<AutoSourceHarness
					tag="photos:2"
					currentScreenKey="list"
					nextScreenKey="detail"
					tick={0}
				/>
				<AutoSourceHarness
					tag="photos:3"
					currentScreenKey="list"
					nextScreenKey="detail"
					tick={0}
				/>
			</Fragment>
		);

		const { rerender } = render(tree);

		expect(measuredTags).toEqual([]);

		BoundStore.registerBoundaryPresence("photos:2", "detail");
		rerender(
			<Fragment>
				<AutoSourceHarness
					tag="photos:1"
					currentScreenKey="list"
					nextScreenKey="detail"
					tick={1}
				/>
				<AutoSourceHarness
					tag="photos:2"
					currentScreenKey="list"
					nextScreenKey="detail"
					tick={1}
				/>
				<AutoSourceHarness
					tag="photos:3"
					currentScreenKey="list"
					nextScreenKey="detail"
					tick={1}
				/>
			</Fragment>,
		);

		expect(measuredTags).toEqual(["photos:2"]);
	});

	it("requests grouped destination refresh for the active member only", () => {
		const calls: string[] = [];

		const { rerender } = render(
			<Fragment>
				<GroupDestinationHarness id="1" tick={0} calls={calls} />
				<GroupDestinationHarness id="2" tick={0} calls={calls} />
				<GroupDestinationHarness id="3" tick={0} calls={calls} />
			</Fragment>,
		);

		BoundStore.setGroupActiveId("photos", "2");
		rerender(
			<Fragment>
				<GroupDestinationHarness id="1" tick={1} calls={calls} />
				<GroupDestinationHarness id="2" tick={1} calls={calls} />
				<GroupDestinationHarness id="3" tick={1} calls={calls} />
			</Fragment>,
		);

		expect(calls).toEqual(["2"]);
	});

	it("requests grouped source refresh for the active member only", () => {
		const calls: string[] = [];
		const isAnimating = createMutableValue(0);

		const tree = (
			<Fragment>
				<GroupSourceHarness id="1" tick={0} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="2" tick={0} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="3" tick={0} calls={calls} isAnimating={isAnimating} />
			</Fragment>
		);

		const { rerender } = render(tree);

		BoundStore.setGroupActiveId("photos", "2");
		rerender(
			<Fragment>
				<GroupSourceHarness id="1" tick={1} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="2" tick={1} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="3" tick={1} calls={calls} isAnimating={isAnimating} />
			</Fragment>,
		);

		expect(calls).toEqual(["2"]);
	});

	it("defers grouped source refresh until animation becomes idle", () => {
		const calls: string[] = [];
		const isAnimating = createMutableValue(1);

		const { rerender } = render(
			<Fragment>
				<GroupSourceHarness id="1" tick={0} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="2" tick={0} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="3" tick={0} calls={calls} isAnimating={isAnimating} />
			</Fragment>,
		);

		BoundStore.setGroupActiveId("photos", "2");
		rerender(
			<Fragment>
				<GroupSourceHarness id="1" tick={1} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="2" tick={1} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="3" tick={1} calls={calls} isAnimating={isAnimating} />
			</Fragment>,
		);

		expect(calls).toEqual([]);

		isAnimating.value = 0;
		rerender(
			<Fragment>
				<GroupSourceHarness id="1" tick={2} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="2" tick={2} calls={calls} isAnimating={isAnimating} />
				<GroupSourceHarness id="3" tick={2} calls={calls} isAnimating={isAnimating} />
			</Fragment>,
		);

		expect(calls).toEqual(["2"]);
	});
});

afterEach(() => {
	globalThis.__reanimatedMeasureSpy = undefined;
	cleanup();
});
