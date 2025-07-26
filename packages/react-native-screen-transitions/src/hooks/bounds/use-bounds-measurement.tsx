import { useCallback, useEffect } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	runOnJS,
	runOnUI,
} from "react-native-reanimated";
import { BoundStore } from "@/store/bound-store";

interface BoundsMeasurementHookProps {
	sharedBoundTag: string;
	animatedRef: AnimatedRef<View>;
	screenKey: string;
}

export const useBoundsMeasurement = ({
	sharedBoundTag,
	animatedRef,
	screenKey,
}: BoundsMeasurementHookProps) => {
	const calculateBounds = useCallback(() => {
		runOnUI(() => {
			const m = measure(animatedRef);

			if (m) {
				runOnJS(BoundStore.setScreenBounds)(screenKey, sharedBoundTag, m);
			}
		})();
	}, [animatedRef, screenKey, sharedBoundTag]);

	useEffect(() => {
		if (sharedBoundTag) {
			calculateBounds();
		}
	}, [calculateBounds, sharedBoundTag]);

	return { calculateBounds };
};
