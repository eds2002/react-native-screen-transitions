import { EPSILON } from "../../../../../constants";
import type { SnapBounds } from "./types";

const getResolvedSnapPointCount = (
	snapPoints: number[],
	resolvedAutoSnap: number | null,
) => {
	"worklet";
	return snapPoints.length + (resolvedAutoSnap !== null ? 1 : 0);
};

const getAutoSnapPointIndex = (
	snapPoints: number[],
	resolvedAutoSnap: number,
) => {
	"worklet";
	let index = 0;

	while (index < snapPoints.length && snapPoints[index] <= resolvedAutoSnap) {
		index++;
	}

	return index;
};

const getResolvedSnapPointAt = (
	snapPoints: number[],
	resolvedAutoSnap: number | null,
	autoSnapPointIndex: number,
	index: number,
) => {
	"worklet";
	if (resolvedAutoSnap === null) {
		return snapPoints[index];
	}

	if (index < autoSnapPointIndex) {
		return snapPoints[index];
	}

	if (index === autoSnapPointIndex) {
		return resolvedAutoSnap;
	}

	return snapPoints[index - 1];
};

export const getResolvedSnapBounds = (
	snapPoints: number[],
	resolvedAutoSnap: number | null,
): SnapBounds | null => {
	"worklet";
	const snapPointCount = getResolvedSnapPointCount(
		snapPoints,
		resolvedAutoSnap,
	);

	if (snapPointCount === 0) {
		return null;
	}

	const autoSnapPointIndex =
		resolvedAutoSnap === null
			? -1
			: getAutoSnapPointIndex(snapPoints, resolvedAutoSnap);
	const firstSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		0,
	);
	const lastSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		snapPointCount - 1,
	);

	return {
		min: Math.min(0, firstSnapPoint),
		max: lastSnapPoint,
	};
};

export const computeAnimatedSnapIndex = (
	progress: number,
	snapPoints: number[],
	resolvedAutoSnap: number | null,
): number => {
	"worklet";
	const snapPointCount = getResolvedSnapPointCount(
		snapPoints,
		resolvedAutoSnap,
	);

	if (snapPointCount === 0) return -1;

	const autoSnapPointIndex =
		resolvedAutoSnap === null
			? -1
			: getAutoSnapPointIndex(snapPoints, resolvedAutoSnap);
	const firstSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		0,
	);
	const lastSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		snapPointCount - 1,
	);

	if (progress <= firstSnapPoint) return 0;
	if (progress >= lastSnapPoint) return snapPointCount - 1;

	for (let i = 0; i < snapPointCount - 1; i++) {
		const currentSnapPoint = getResolvedSnapPointAt(
			snapPoints,
			resolvedAutoSnap,
			autoSnapPointIndex,
			i,
		);
		const nextSnapPoint = getResolvedSnapPointAt(
			snapPoints,
			resolvedAutoSnap,
			autoSnapPointIndex,
			i + 1,
		);

		if (progress <= nextSnapPoint) {
			const t =
				(progress - currentSnapPoint) / (nextSnapPoint - currentSnapPoint);
			return i + t;
		}
	}
	return snapPointCount - 1;
};

export const computeTargetSnapIndex = (
	targetProgress: number,
	snapPoints: number[],
	resolvedAutoSnap: number | null,
): number => {
	"worklet";
	const snapPointCount = getResolvedSnapPointCount(
		snapPoints,
		resolvedAutoSnap,
	);

	if (snapPointCount === 0) return -1;

	const autoSnapPointIndex =
		resolvedAutoSnap === null
			? -1
			: getAutoSnapPointIndex(snapPoints, resolvedAutoSnap);
	const firstSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		0,
	);

	if (targetProgress <= 0 && Math.abs(firstSnapPoint) > EPSILON) {
		return -1;
	}

	let nearestIndex = 0;
	let smallestDistance = Math.abs(targetProgress - firstSnapPoint);

	for (let i = 1; i < snapPointCount; i++) {
		const snapPoint = getResolvedSnapPointAt(
			snapPoints,
			resolvedAutoSnap,
			autoSnapPointIndex,
			i,
		);
		const distance = Math.abs(targetProgress - snapPoint);

		if (distance < smallestDistance) {
			smallestDistance = distance;
			nearestIndex = i;
		}
	}

	return nearestIndex;
};
