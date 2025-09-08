import { useCallback } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	runOnJS,
	runOnUI,
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
	onPress?: ((...args: unknown[]) => void) | undefined;
}

export const useBoundsRegistry = ({
	sharedBoundTag,
	animatedRef,
	current,
	style,
	onPress,
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

	const handlePress = useCallback(
		(...args: unknown[]) => {
			// Intercept onPress: measure first, only proceed when successful
			runOnUI((key: string, id: string) => {
				"worklet";
				if (!id) return;
				const measured = measure(animatedRef);
				if (measured) {
					Bounds.setRouteActive(key, id);
					// Broadcast to children first so they can remeasure before we store
					// (ordering doesn't affect outcome, but keeps cascade consistent)
					// Then store this node's bounds
					boundGroup?.broadcast();
					Bounds.setBounds(key, id, measured, flattenStyle(style));
					if (onPress) {
						runOnJS(onPress)(...args);
					}
				}
			})(current.route.key, sharedBoundTag);
		},
		[
			animatedRef,
			current.route.key,
			onPress,
			sharedBoundTag,
			style,
			boundGroup,
		],
	);

	return {
		measureBounds,
		handleLayout,
		handlePress,
	};
};
