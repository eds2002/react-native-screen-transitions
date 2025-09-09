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
	sharedBoundTag: string;
	animatedRef: AnimatedRef<View>;
	current: { route: { key: string } };
	style: StyleProps;
	onPress?: ((...args: unknown[]) => void) | undefined;
}

const MeasurementUpdateContext = createContext<{
	updateSignal: SharedValue<number>;
} | null>(null);

export const useBoundsRegistry = ({
	sharedBoundTag,
	animatedRef,
	current,
	style,
	onPress,
}: BoundMeasurerHookProps) => {
	const { previous } = useKeys();

	const ROOT_MEASUREMENT_SIGNAL = useContext(MeasurementUpdateContext);
	const ROOT_SIGNAL = useSharedValue(0);
	const IS_ROOT = !ROOT_MEASUREMENT_SIGNAL;

	const maybeMeasureAndStore = useCallback(() => {
		"worklet";
		if (!sharedBoundTag) return;

		const measured = measure(animatedRef);

		if (!measured) return;

		const key = current.route.key;

		if (isBoundsEqual({ measured, key, sharedBoundTag })) {
			if (Bounds.getRouteActive(key) === sharedBoundTag) {
				Bounds.setRouteActive(key, sharedBoundTag);
			}
			return;
		}

		// We want our children to measure again as well.
		if (IS_ROOT) {
			ROOT_SIGNAL.value = ROOT_SIGNAL.value + 1;
		}

		Bounds.setBounds(key, sharedBoundTag, measured, flattenStyle(style));

		if (Bounds.getRouteActive(key) === sharedBoundTag) {
			Bounds.setRouteActive(key, sharedBoundTag);
		}
	}, [
		sharedBoundTag,
		animatedRef,
		current.route.key,
		style,
		IS_ROOT,
		ROOT_SIGNAL,
	]);

	const handleTransitionLayout = useCallback(() => {
		"worklet";
		if (!sharedBoundTag || !previous?.route.key) {
			return;
		}

		const previousBounds = Bounds.getBounds(previous?.route.key);

		if (previousBounds) {
			maybeMeasureAndStore();
		}
	}, [maybeMeasureAndStore, sharedBoundTag, previous?.route.key]);

	const captureActiveOnPress = useStableCallback((...args: unknown[]) => {
		if (!sharedBoundTag) {
			if (onPress) {
				onPress(...args);
			}
			return;
		}

		runOnUI(() => {
			"worklet";
			const measured = measure(animatedRef);

			if (!measured) return;

			Bounds.setRouteActive(current.route.key, sharedBoundTag);

			if (IS_ROOT) {
				ROOT_SIGNAL.value = ROOT_SIGNAL.value + 1;
			}

			Bounds.setBounds(
				current.route.key,
				sharedBoundTag,
				measured,
				flattenStyle(style),
			);

			if (onPress) {
				runOnJS(onPress)(...args);
			}
		})();
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
			if (current === 0 || current === undefined) return; // We don't want to run on the initial amount
			maybeMeasureAndStore();
		},
	);

	return {
		handleTransitionLayout,
		captureActiveOnPress,
		MeasurementSyncProvider,
	};
};
