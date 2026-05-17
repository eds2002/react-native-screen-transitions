import { expect } from "bun:test";
import {
	BoundStore,
	type BoundaryConfig,
	type ResolveTransitionContext,
	type ResolvedTransitionPair,
	type Snapshot,
} from "../../../stores/bounds";
import { createScreenPairKey } from "../../../stores/bounds/helpers/link-pairs.helpers";

export const createBounds = (
	x = 0,
	y = 0,
	width = 100,
	height = 100,
): Snapshot["bounds"] => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

export const makeContext = (
	overrides: Partial<ResolveTransitionContext> = {},
): ResolveTransitionContext => ({
	currentScreenKey: undefined,
	previousScreenKey: undefined,
	nextScreenKey: undefined,
	entering: false,
	...overrides,
});

export const makeTag = (
	id: string | number,
	group?: string,
): string => (group ? `${group}:${id}` : String(id));

export const registerMeasuredEntry = (
	tag: string,
	screenKey: string,
	bounds: Snapshot["bounds"],
	styles: Snapshot["styles"] = {},
) => {
	BoundStore.entry.set(tag, screenKey, {
		bounds,
		styles,
	});
};

export const registerBoundaryPresence = (
	tag: string,
	screenKey: string,
	boundaryConfig?: BoundaryConfig,
) => {
	BoundStore.entry.set(tag, screenKey, {
		boundaryConfig,
	});
};

export const hasBoundaryPresence = (tag: string, screenKey: string) => {
	return BoundStore.entry.get(tag, screenKey) !== null;
};

type RegisterSourceAndDestinationParams = {
	tag: string;
	sourceScreenKey: string;
	destinationScreenKey: string;
	sourceBounds?: Snapshot["bounds"];
	destinationBounds?: Snapshot["bounds"];
};

export const registerSourceAndDestination = ({
	tag,
	sourceScreenKey,
	destinationScreenKey,
	sourceBounds = createBounds(0, 0, 120, 120),
	destinationBounds = createBounds(200, 300, 180, 180),
}: RegisterSourceAndDestinationParams) => {
	const pairKey = createScreenPairKey(sourceScreenKey, destinationScreenKey);

	BoundStore.link.setSource(pairKey,
		tag,
		sourceScreenKey,
		sourceBounds,
		{},
	);

	BoundStore.link.setDestination(pairKey,
		tag,
		destinationScreenKey,
		destinationBounds,
		{},
	);
};

export const setDestination = ({
	tag,
	sourceScreenKey = "screen-a",
	destinationScreenKey,
	destinationBounds,
}: {
	tag: string;
	sourceScreenKey?: string;
	destinationScreenKey: string;
	destinationBounds: Snapshot["bounds"];
}) => {
	const pairKey = createScreenPairKey(sourceScreenKey, destinationScreenKey);
	BoundStore.link.setDestination(pairKey,
		tag,
		destinationScreenKey,
		destinationBounds,
	);
};

type ExpectedResolvedPair = {
	sourceScreenKey?: string | null;
	destinationScreenKey?: string | null;
	sourceBounds?: Snapshot["bounds"] | null;
	destinationBounds?: Snapshot["bounds"] | null;
};

export const expectResolvedPair = (
	pair: ResolvedTransitionPair,
	expected: ExpectedResolvedPair,
) => {
	if (expected.sourceScreenKey !== undefined) {
		expect(pair.sourceScreenKey).toBe(expected.sourceScreenKey);
	}

	if (expected.destinationScreenKey !== undefined) {
		expect(pair.destinationScreenKey).toBe(expected.destinationScreenKey);
	}

	if (expected.sourceBounds !== undefined) {
		expect(pair.sourceBounds).toEqual(expected.sourceBounds);
	}

	if (expected.destinationBounds !== undefined) {
		expect(pair.destinationBounds).toEqual(expected.destinationBounds);
	}

};
