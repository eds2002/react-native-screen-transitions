import { useCallback } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	type StyleProps,
	useSharedValue,
} from "react-native-reanimated";
import { useKeys } from "../../navigator/context/keys";
import { useScreenAnimation } from "../../navigator/hooks/use-screen-animation";
import { Bounds } from "../../navigator/stores/bounds";

interface BoundMeasurerHookProps {
	sharedBoundTag: string;
	animatedRef: AnimatedRef<View>;
	current: { route: { key: string } };
	style: StyleProps;
}

export const useBoundMeasurer = ({
	sharedBoundTag,
	animatedRef,
	current,
	style,
}: BoundMeasurerHookProps) => {
	const { previous } = useKeys();
	const interpolatorProps = useScreenAnimation();
	const hasAlreadyMeasured = useSharedValue(false);

	const measureAndSet = useCallback(() => {
		"worklet";
		if (!sharedBoundTag) return;
		const measured = measure(animatedRef);
		if (measured) {
			Bounds.setBounds(current.route.key, sharedBoundTag, measured, style);
		}
	}, [sharedBoundTag, animatedRef, current.route.key, style]);

	const measureOnLayout = useCallback(() => {
		"worklet";
		if (!sharedBoundTag || hasAlreadyMeasured.value) return;

		const previousRouteKey = previous?.route.key;
		if (!previousRouteKey) return;

		const previousBounds = Bounds.getBounds(previousRouteKey);
		const hasPreviousBoundForTag = previousBounds[sharedBoundTag];

		if (interpolatorProps.value.current.animating && hasPreviousBoundForTag) {
			measureAndSet();
			hasAlreadyMeasured.value = true;
		}
	}, [
		measureAndSet,
		interpolatorProps,
		sharedBoundTag,
		previous?.route.key,
		hasAlreadyMeasured,
	]);

	return {
		measureAndSet,
		measureOnLayout,
	};
};
