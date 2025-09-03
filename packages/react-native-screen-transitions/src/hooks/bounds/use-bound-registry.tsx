import { useCallback } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	type StyleProps,
	useSharedValue,
} from "react-native-reanimated";
import { useKeys } from "../../providers/keys";
import { Bounds } from "../../stores/bounds";
import { flattenStyle } from "../../utils/bounds/_utils/flatten-styles";
import { isBoundsEqual } from "../../utils/bounds/_utils/is-bounds-equal";
import { useScreenAnimation } from "../animation/use-screen-animation";

interface BoundMeasurerHookProps {
	sharedBoundTag: string;
	animatedRef: AnimatedRef<View>;
	current: { route: { key: string } };
	style: StyleProps;
}

export const useBoundsRegistry = ({
	sharedBoundTag,
	animatedRef,
	current,
	style,
}: BoundMeasurerHookProps) => {
	const { previous } = useKeys();
	const interpolatorProps = useScreenAnimation();
	const isMeasured = useSharedValue(false);

	const measureBounds = useCallback(() => {
		"worklet";
		if (!sharedBoundTag) return;
		const measured = measure(animatedRef);
		if (measured) {
			const key = current.route.key;
			if (isBoundsEqual({ measured, key, sharedBoundTag })) {
				Bounds.setRouteActive(key, sharedBoundTag);
				return;
			}

			Bounds.setBounds(key, sharedBoundTag, measured, flattenStyle(style));
			Bounds.setRouteActive(key, sharedBoundTag);
		}
	}, [sharedBoundTag, animatedRef, current.route.key, style]);

	const handleLayout = useCallback(() => {
		"worklet";
		const previousRouteKey = previous?.route.key;
		if (!sharedBoundTag || isMeasured.value || !previousRouteKey) {
			return;
		}

		const previousBounds = Bounds.getBounds(previousRouteKey);
		const hasPreviousBoundForTag = previousBounds[sharedBoundTag];

		if (interpolatorProps.value.current.animating && hasPreviousBoundForTag) {
			measureBounds();
			isMeasured.value = true;
		}
	}, [
		measureBounds,
		interpolatorProps,
		sharedBoundTag,
		previous?.route.key,
		isMeasured,
	]);

	const measureOnTouchStart = useCallback(() => {
		"worklet";
		if (sharedBoundTag) {
			Bounds.setActiveBoundId(sharedBoundTag);
			measure(animatedRef);
		}
	}, [sharedBoundTag, animatedRef]);

	return {
		measureBounds,
		handleLayout,
		measureOnTouchStart,
	};
};
