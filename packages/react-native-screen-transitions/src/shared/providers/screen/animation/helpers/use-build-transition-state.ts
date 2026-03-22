import { useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { createScreenTransitionState } from "../../../../constants";
import { AnimationStore } from "../../../../stores/animation.store";
import {
	GestureStore,
	type GestureStoreMap,
} from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import type {
	BaseStackRoute,
	Layout,
	ScreenTransitionState,
} from "../../../../types";
import type { BaseDescriptor } from "../../descriptors";
import { toPlainRoute, toPlainValue } from "./worklet";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	entering: SharedValue<number>;
	gesture: GestureStoreMap;
	route: BaseStackRoute;
	meta?: Record<string, unknown>;
	resolvedAutoSnapPoint: SharedValue<number>;
	measuredContentLayout: SharedValue<Layout | null>;
	hasAutoSnapPoint: boolean;
	sortedNumericSnapPoints: number[];
	unwrapped: ScreenTransitionState;
};

export const useBuildTransitionState = (
	descriptor: BaseDescriptor | undefined,
	slot: "current" | "next" | "previous",
): BuiltState | undefined => {
	const key = descriptor?.route?.key;
	const meta = descriptor?.options?.meta;
	const route = descriptor?.route;
	const gestureEnabled = descriptor?.options?.gestureEnabled;
	const snapPoints = descriptor?.options?.snapPoints;

	const shouldUseNeutralNextGestures =
		slot === "next" &&
		gestureEnabled === false &&
		(!snapPoints || snapPoints.length === 0);

	return useMemo(() => {
		if (!key || !route) return undefined;

		const plainRoute = toPlainRoute(route);
		const plainMeta = meta
			? (toPlainValue(meta) as Record<string, unknown>)
			: undefined;

		const sortedNumericSnapPoints = (snapPoints ?? [])
			.filter((p): p is number => typeof p === "number")
			.sort((a, b) => a - b);

		return {
			progress: AnimationStore.getValue(key, "progress"),
			closing: AnimationStore.getValue(key, "closing"),
			entering: AnimationStore.getValue(key, "entering"),
			animating: AnimationStore.getValue(key, "animating"),
			resolvedAutoSnapPoint: SystemStore.getValue(key, "resolvedAutoSnapPoint"),
			measuredContentLayout: SystemStore.getValue(key, "measuredContentLayout"),
			hasAutoSnapPoint: snapPoints?.includes("auto") ?? false,
			sortedNumericSnapPoints,
			gesture: shouldUseNeutralNextGestures
				? (GestureStore.peekBag(key) ?? GestureStore.getCachedBag())
				: GestureStore.getBag(key),
			route: plainRoute,
			meta: plainMeta,
			unwrapped: createScreenTransitionState(plainRoute, plainMeta),
		};
	}, [key, meta, route, shouldUseNeutralNextGestures, snapPoints]);
};
