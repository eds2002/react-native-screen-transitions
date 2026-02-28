import { expect } from "bun:test";
import {
	BoundStore,
	type ResolveTransitionContext,
	type ResolvedTransitionPair,
	type Snapshot,
} from "../../stores/bounds";

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

type RegisterSourceAndDestinationParams = {
	tag: string;
	sourceScreenKey: string;
	destinationScreenKey: string;
	sourceBounds?: Snapshot["bounds"];
	destinationBounds?: Snapshot["bounds"];
	sourceAncestorKeys?: string[];
	destinationAncestorKeys?: string[];
	expectedSourceScreenKey?: string;
	sourceNavigatorKey?: string;
	sourceAncestorNavigatorKeys?: string[];
	destinationNavigatorKey?: string;
	destinationAncestorNavigatorKeys?: string[];
};

export const registerSourceAndDestination = ({
	tag,
	sourceScreenKey,
	destinationScreenKey,
	sourceBounds = createBounds(0, 0, 120, 120),
	destinationBounds = createBounds(200, 300, 180, 180),
	sourceAncestorKeys,
	destinationAncestorKeys,
	expectedSourceScreenKey,
	sourceNavigatorKey,
	sourceAncestorNavigatorKeys,
	destinationNavigatorKey,
	destinationAncestorNavigatorKeys,
}: RegisterSourceAndDestinationParams) => {
	BoundStore.setLinkSource(
		tag,
		sourceScreenKey,
		sourceBounds,
		{},
		sourceAncestorKeys,
		sourceNavigatorKey,
		sourceAncestorNavigatorKeys,
	);

	BoundStore.setLinkDestination(
		tag,
		destinationScreenKey,
		destinationBounds,
		{},
		destinationAncestorKeys,
		expectedSourceScreenKey,
		destinationNavigatorKey,
		destinationAncestorNavigatorKeys,
	);
};

type ExpectedResolvedPair = {
	sourceScreenKey?: string | null;
	destinationScreenKey?: string | null;
	sourceBounds?: Snapshot["bounds"] | null;
	destinationBounds?: Snapshot["bounds"] | null;
	usedPending?: boolean;
	usedSnapshotSource?: boolean;
	usedSnapshotDestination?: boolean;
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

	if (expected.usedPending !== undefined) {
		expect(pair.usedPending).toBe(expected.usedPending);
	}

	if (expected.usedSnapshotSource !== undefined) {
		expect(pair.usedSnapshotSource).toBe(expected.usedSnapshotSource);
	}

	if (expected.usedSnapshotDestination !== undefined) {
		expect(pair.usedSnapshotDestination).toBe(
			expected.usedSnapshotDestination,
		);
	}
};
