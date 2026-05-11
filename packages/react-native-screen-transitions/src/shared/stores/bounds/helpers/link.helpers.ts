import type { ScreenKey, TagLink } from "../types";
import { findLatestIndex } from "./find-latest";
import { matchesScreenKey } from "./matching";

type LinkSide = "source" | "destination";

export const isSameScreenFamily = (
	a: { screenKey: ScreenKey },
	b: { screenKey: ScreenKey },
): boolean => {
	"worklet";
	return a.screenKey === b.screenKey;
};

export function findLatestPendingSourceLinkIndex(
	stack: TagLink[],
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	return findLatestIndex(stack, (link) => {
		if (link.destination !== null) return false;
		return (
			!expectedSourceScreenKey ||
			matchesScreenKey(link.source, expectedSourceScreenKey)
		);
	});
}

function findLatestSourceIndex(
	stack: TagLink[],
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	if (!expectedSourceScreenKey) return -1;

	return findLatestIndex(stack, (link) =>
		matchesScreenKey(link.source, expectedSourceScreenKey),
	);
}

function findLatestCompletedSourceIndex(
	stack: TagLink[],
	screenKey?: ScreenKey,
): number {
	"worklet";
	if (!screenKey) return -1;

	return findLatestIndex(
		stack,
		(link) => !!link.destination && matchesScreenKey(link.source, screenKey),
	);
}

function findLatestCompletedDestinationIndex(
	stack: TagLink[],
	screenKey?: ScreenKey,
): number {
	"worklet";
	if (!screenKey) return -1;

	return findLatestIndex(
		stack,
		(link) =>
			!!link.destination && matchesScreenKey(link.destination, screenKey),
	);
}

export function selectSourceUpdateTargetIndex(
	stack: TagLink[],
	screenKey: ScreenKey,
): number {
	"worklet";
	const completedIndex = findLatestCompletedSourceIndex(stack, screenKey);
	if (completedIndex !== -1) {
		return completedIndex;
	}

	return findLatestSourceIndex(stack, screenKey);
}

export function findLinkIndexForDestinationWrite(
	stack: TagLink[],
	destinationScreenKey?: ScreenKey,
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	const existingDestinationIndex = findLatestCompletedDestinationIndex(
		stack,
		destinationScreenKey,
	);
	if (existingDestinationIndex !== -1) {
		return existingDestinationIndex;
	}

	const pendingSourceIndex = findLatestPendingSourceLinkIndex(
		stack,
		expectedSourceScreenKey,
	);
	if (pendingSourceIndex !== -1) {
		return pendingSourceIndex;
	}

	return findLatestSourceIndex(stack, expectedSourceScreenKey);
}

export function hasLinkSide(
	stack: TagLink[] | undefined,
	screenKey: ScreenKey,
	side: LinkSide,
): boolean {
	"worklet";
	if (!stack || stack.length === 0) return false;

	return (
		findLatestIndex(stack, (link) =>
			matchesScreenKey(link[side], screenKey),
		) !== -1
	);
}

export function isCompletedLinkForScreenKey(
	link: TagLink,
	screenKey: ScreenKey,
): boolean {
	"worklet";
	return (
		!!link.destination &&
		(matchesScreenKey(link.source, screenKey) ||
			matchesScreenKey(link.destination, screenKey))
	);
}
