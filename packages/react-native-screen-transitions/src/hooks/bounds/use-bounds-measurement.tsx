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
	onPress?: () => void;
}

export const useBoundsMeasurement = ({
	sharedBoundTag,
	animatedRef,
	screenKey,
	onPress,
}: BoundsMeasurementHookProps) => {
	const activeTag = BoundStore.getActiveTag();
	const measurementExists = BoundStore.hasBounds(screenKey, sharedBoundTag);

	const measureNow = useCallback(() => {
		return new Promise<void>((resolve) => {
			runOnUI(() => {
				const m = measure(animatedRef);
				if (m) {
					runOnJS(BoundStore.setScreenBounds)(screenKey, sharedBoundTag, m);
				}
				runOnJS(resolve)();
			})();
		});
	}, [animatedRef, screenKey, sharedBoundTag]);

	const interceptedOnPress = useCallback(async () => {
		if (sharedBoundTag) {
			await measureNow();
		}
		if (onPress) {
			onPress();
		}
	}, [onPress, measureNow, sharedBoundTag]);

	useEffect(() => {
		if (sharedBoundTag && activeTag === sharedBoundTag && !measurementExists) {
			measureNow();
		}
	}, [measureNow, sharedBoundTag, activeTag, measurementExists]);

	return { interceptedOnPress };
};
