import { useCallback } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import { useBoundGroup } from "../../providers/bound-group";
import { useKeys } from "../../providers/keys";
import { Bounds } from "../../stores/bounds";
import { flattenStyle } from "../../utils/bounds/_utils/flatten-styles";
import { isBoundsEqual } from "../../utils/bounds/_utils/is-bounds-equal";

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

	const boundGroup = useBoundGroup();

	const measureBounds = useCallback(() => {
		"worklet";
		if (!sharedBoundTag) return;
		const measured = measure(animatedRef);
		if (measured) {
			const key = current.route.key;

			// Avoid setting bounds if the bounds are already set
			if (isBoundsEqual({ measured, key, sharedBoundTag })) {
				if (Bounds.getRouteActive(key) === sharedBoundTag) {
					Bounds.setRouteActive(key, sharedBoundTag);
				}
				return;
			}

			// Tell children to measure again
			boundGroup?.broadcast();

			Bounds.setBounds(key, sharedBoundTag, measured, flattenStyle(style));

			if (Bounds.getRouteActive(key) === sharedBoundTag) {
				Bounds.setRouteActive(key, sharedBoundTag);
			}
		}
	}, [sharedBoundTag, animatedRef, current.route.key, style, boundGroup]);

	const handleLayout = useCallback(() => {
		"worklet";
		const previousRouteKey = previous?.route.key;

		if (!sharedBoundTag || !previousRouteKey) {
			return;
		}

		const previousBounds = Bounds.getBounds(previousRouteKey);
		const hasPreviousBoundForTag = previousBounds[sharedBoundTag];

		if (hasPreviousBoundForTag) {
			measureBounds();
		}
	}, [measureBounds, sharedBoundTag, previous?.route.key]);

	return {
		measureBounds,
		handleLayout,
	};
};
