import {
	createContext,
	Fragment,
	useCallback,
	useContext,
	useMemo,
} from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	runOnJS,
	runOnUI,
	type StyleProps,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated/lib/typescript/commonTypes";
import { useKeys } from "../../providers/keys";
import { Bounds } from "../../stores/bounds";
import { flattenStyle } from "../../utils/bounds/_utils/flatten-styles";
import { isBoundsEqual } from "../../utils/bounds/_utils/is-bounds-equal";
import useStableCallback from "../use-stable-callback";

interface BoundMeasurerHookProps {
	sharedBoundTag?: string;
	animatedRef: AnimatedRef<View>;
	style: StyleProps;
	onPress?: ((...args: unknown[]) => void) | undefined;
}

interface MaybeMeasureAndStoreParams {
	onPress?: ((...args: unknown[]) => void) | undefined;
	skipMarkingActive?: boolean;
}

interface MeasurementUpdateContextType {
	updateSignal: SharedValue<number>;
}

const MeasurementUpdateContext =
	createContext<MeasurementUpdateContextType | null>(null);

export const useBoundsRegistry = ({
	sharedBoundTag,
	animatedRef,
	style,
	onPress,
}: BoundMeasurerHookProps) => {
	const { previous, current, next } = useKeys();

	const ROOT_MEASUREMENT_SIGNAL = useContext(MeasurementUpdateContext);
	const ROOT_SIGNAL = useSharedValue(0);
	const IS_ROOT = !ROOT_MEASUREMENT_SIGNAL;

	const emitUpdate = useCallback(() => {
		"worklet";
		if (IS_ROOT) ROOT_SIGNAL.value = ROOT_SIGNAL.value + 1;
	}, [IS_ROOT, ROOT_SIGNAL]);

	const maybeMeasureAndStore = useCallback(
		({ onPress, skipMarkingActive }: MaybeMeasureAndStoreParams) => {
			"worklet";
			// Currently, there's no necessity to measure when the current route is blurred ( could potentially change in the future )
			if (!sharedBoundTag || next) return;

			const measured = measure(animatedRef);

			if (!measured) {
				console.warn(
					`[react-native-screen-transitions] measure() returned null for sharedBoundTag="${sharedBoundTag}"`,
				);
				return;
			}

			const key = current.route.key;

			if (isBoundsEqual({ measured, key, sharedBoundTag })) {
				emitUpdate();
				if (!skipMarkingActive) {
					Bounds.setRouteActive(key, sharedBoundTag);
				}
				if (onPress) runOnJS(onPress)();
				return;
			}

			emitUpdate();

			Bounds.setBounds(key, sharedBoundTag, measured, flattenStyle(style));
			if (!skipMarkingActive) {
				Bounds.setRouteActive(key, sharedBoundTag);
			}

			if (onPress) runOnJS(onPress)();
		},
		[sharedBoundTag, animatedRef, current.route.key, style, emitUpdate, next],
	);

	const hasMeasuredOnLayout = useSharedValue(false);
	const handleInitialLayout = useCallback(() => {
		"worklet";

		const prevKey = previous?.route.key;
		if (!sharedBoundTag || hasMeasuredOnLayout.value || !prevKey) {
			return;
		}

		const prevBounds = Bounds.getBounds(prevKey)?.[sharedBoundTag];

		if (prevBounds) {
			// Should skip mark active if we are in a transition
			maybeMeasureAndStore({ skipMarkingActive: true });
			// Should not measure again while in transition
			hasMeasuredOnLayout.value = true;
		}
	}, [
		maybeMeasureAndStore,
		sharedBoundTag,
		previous?.route.key,
		hasMeasuredOnLayout,
	]);

	const captureActiveOnPress = useStableCallback(() => {
		if (!sharedBoundTag) {
			if (onPress) onPress();
			return;
		}

		// In this case, we DO want to mark active
		runOnUI(maybeMeasureAndStore)({ onPress });
	});

	const MeasurementSyncProvider = useMemo(() => {
		if (!IS_ROOT || !sharedBoundTag) {
			return Fragment;
		}

		return ({ children }: { children: React.ReactNode }) => (
			<MeasurementUpdateContext.Provider value={{ updateSignal: ROOT_SIGNAL }}>
				{children}
			</MeasurementUpdateContext.Provider>
		);
	}, [IS_ROOT, sharedBoundTag, ROOT_SIGNAL]);

	useAnimatedReaction(
		() => ROOT_MEASUREMENT_SIGNAL?.updateSignal.value,
		(current) => {
			"worklet";

			// We don't want to run on the initial amount)
			if (current === 0 || current === undefined) return;

			// Children should not have the ability to mark active
			maybeMeasureAndStore({ skipMarkingActive: true });
		},
	);

	return {
		handleInitialLayout,
		captureActiveOnPress,
		MeasurementSyncProvider,
	};
};
