import { useCallback, useEffect } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	runOnJS,
	runOnUI,
	useSharedValue,
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
	const isMeasured = useSharedValue(false);

	const calculateBounds = useCallback(() => {
		runOnUI(() => {
			const m = measure(animatedRef);

			if (m) {
				runOnJS(BoundStore.setScreenBounds)(screenKey, sharedBoundTag, m);
				isMeasured.value = true;
			}
		})();
	}, [animatedRef, isMeasured, screenKey, sharedBoundTag]);

	useEffect(() => {
		if (sharedBoundTag) {
			calculateBounds();
		}
	}, [calculateBounds, sharedBoundTag]);

	return { calculateBounds, isMeasured };
};
