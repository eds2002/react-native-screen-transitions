import {
	createContext,
	Fragment,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
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
import { AnimationStore } from "../../stores/animation-store";
import { BoundStore } from "../../stores/bound-store";
import { prepareStyleForBounds } from "../../utils/bounds/_utils/styles";
import useStableCallback from "../use-stable-callback";
import useStableCallbackValue from "../use-stable-callback-value";

interface BoundMeasurerHookProps {
	sharedBoundTag?: string;
	animatedRef: AnimatedRef<View>;
	style: StyleProps;
	onPress?: ((...args: unknown[]) => void) | undefined;
}

interface MaybeMeasureAndStoreParams {
	onPress?: ((...args: unknown[]) => void) | undefined;
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
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
	const { current, next } = useKeys();
	const isAnimating = AnimationStore.getAnimation(
		current.route.key,
		"animating",
	);
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);

	const ROOT_MEASUREMENT_SIGNAL = useContext(MeasurementUpdateContext);
	const ROOT_SIGNAL = useSharedValue(0);
	const IS_ROOT = !ROOT_MEASUREMENT_SIGNAL;

	const emitUpdate = useStableCallbackValue(() => {
		"worklet";
		if (IS_ROOT) ROOT_SIGNAL.value = ROOT_SIGNAL.value + 1;
	});

	const maybeMeasureAndStore = useStableCallbackValue(
		({
			onPress,
			shouldSetSource,
			shouldSetDestination,
		}: MaybeMeasureAndStoreParams = {}) => {
			"worklet";
			if (!sharedBoundTag) return;

			const measured = measure(animatedRef);
			if (!measured) return;

			const key = current.route.key;

			emitUpdate();
			// 1. Always update the registry map
			BoundStore.registerOccurrence(
				sharedBoundTag,
				key,
				measured,
				preparedStyles,
			);

			// 2. If this is a press (or passive start), I am the SOURCE
			if (shouldSetSource) {
				if (isAnimating.value) {
					// If its animating, we don't want to trigger a remeasure, we instead just want to use the existing measurements if any
					const recordedMeasurements = BoundStore.getOccurrence(
						sharedBoundTag,
						key,
					);
					BoundStore.setLinkSource(
						sharedBoundTag,
						key,
						recordedMeasurements.bounds,
						preparedStyles,
					);
					return;
				}
				BoundStore.setLinkSource(sharedBoundTag, key, measured, preparedStyles);
			}

			// 3. If I am waking up and a source exists, I am the DESTINATION
			if (shouldSetDestination) {
				// This checks inside if a source exists before setting itself
				BoundStore.setLinkDestination(
					sharedBoundTag,
					key,
					measured,
					preparedStyles,
				);
			}

			if (onPress) runOnJS(onPress)();
		},
	);

	const hasMeasuredOnLayout = useSharedValue(false);

	const handleInitialLayout = useStableCallbackValue(() => {
		"worklet";
		if (!sharedBoundTag || hasMeasuredOnLayout.value || !isAnimating.value)
			return;

		maybeMeasureAndStore({
			shouldSetSource: false,
			shouldSetDestination: true,
		});

		hasMeasuredOnLayout.value = true;
	});

	const captureActiveOnPress = useStableCallback(() => {
		if (!sharedBoundTag) {
			if (onPress) onPress();
			return;
		}
		// I am the Source
		runOnUI(maybeMeasureAndStore)({ onPress, shouldSetSource: true });
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

	const prevNextRef = useRef(next);
	/**
	 * Measure non-pressable elements when the screen goes from focused to blurred
	 * (or when a new `next` descriptor appears) so we capture final bounds
	 * right before the transition starts.
	 */
	useLayoutEffect(() => {
		if (!sharedBoundTag || onPress) return;

		const hadNext = !!prevNextRef.current;
		const hasNext = !!next;

		if (!hadNext && hasNext) {
			runOnUI(maybeMeasureAndStore)({
				shouldSetSource: true,
			});
		}

		prevNextRef.current = next;
	}, [next, sharedBoundTag, onPress, maybeMeasureAndStore]);

	/**
	 * Signal child shared elements (nested under this provider) to refresh their
	 * measurements when the root updates.
	 */
	useAnimatedReaction(
		() => ROOT_MEASUREMENT_SIGNAL?.updateSignal.value,
		(current) => {
			"worklet";

			if (current === 0 || current === undefined) return;

			maybeMeasureAndStore();
		},
	);

	return {
		handleInitialLayout,
		captureActiveOnPress,
		MeasurementSyncProvider,
	};
};
