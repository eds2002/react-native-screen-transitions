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
import type { ScreenTransitionOptions } from "../../../../types/animation.types";
import type { BaseDescriptor } from "../../descriptors";
import { toPlainRoute, toPlainValue } from "./worklet";

type BuiltState = {
	progress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	entering: SharedValue<number>;
	settled: SharedValue<number>;
	logicallySettled: SharedValue<number>;
	gesture: GestureStoreMap;
	route: BaseStackRoute;
	meta?: Record<string, unknown>;
	options: ScreenTransitionOptions;
	navigationMaskEnabled: boolean;
	targetProgress: SharedValue<number>;
	resolvedAutoSnapPoint: SharedValue<number>;
	measuredContentLayout: SharedValue<Layout | null>;
	contentLayoutSlot: Layout;
	hasAutoSnapPoint: boolean;
	sortedNumericSnapPoints: number[];
	unwrapped: ScreenTransitionState;
};

export const useBuildTransitionState = (
	descriptor: BaseDescriptor | undefined,
): BuiltState | undefined => {
	const key = descriptor?.route?.key;
	const meta = descriptor?.options?.meta;
	const route = descriptor?.route;
	const navigationMaskEnabled = !!descriptor?.options?.navigationMaskEnabled;
	const snapPoints = descriptor?.options?.snapPoints;

	return useMemo(() => {
		if (!key || !route) return undefined;

		const plainRoute = toPlainRoute(route);
		const plainMeta = meta
			? (toPlainValue(meta) as Record<string, unknown>)
			: undefined;

		const sortedNumericSnapPoints = (snapPoints ?? [])
			.filter((p): p is number => typeof p === "number")
			.sort((a, b) => a - b);

		const transitionOptions: ScreenTransitionOptions = {
			gestureEnabled: descriptor.options.gestureEnabled,
			gestureDirection: descriptor?.options?.gestureDirection,
			gestureSnapLocked: descriptor.options.gestureSnapLocked,
			experimental_allowDisabledGestureTracking:
				descriptor.options.experimental_allowDisabledGestureTracking,
		};

		return {
			progress: AnimationStore.getValue(key, "progress"),
			willAnimate: AnimationStore.getValue(key, "willAnimate"),
			closing: AnimationStore.getValue(key, "closing"),
			entering: AnimationStore.getValue(key, "entering"),
			animating: AnimationStore.getValue(key, "animating"),
			settled: AnimationStore.getValue(key, "settled"),
			logicallySettled: AnimationStore.getValue(key, "logicallySettled"),
			targetProgress: SystemStore.getValue(key, "targetProgress"),
			resolvedAutoSnapPoint: SystemStore.getValue(key, "resolvedAutoSnapPoint"),
			measuredContentLayout: SystemStore.getValue(key, "measuredContentLayout"),
			contentLayoutSlot: { width: 0, height: 0 },
			hasAutoSnapPoint: snapPoints?.includes("auto") ?? false,
			sortedNumericSnapPoints,
			gesture: GestureStore.getBag(key),
			route: plainRoute,
			meta: plainMeta,
			options: transitionOptions,
			navigationMaskEnabled,
			unwrapped: createScreenTransitionState(
				plainRoute,
				plainMeta,
				navigationMaskEnabled,
				transitionOptions,
			),
		};
	}, [
		key,
		meta,
		route,
		snapPoints,
		navigationMaskEnabled,
		descriptor?.options,
	]);
};
