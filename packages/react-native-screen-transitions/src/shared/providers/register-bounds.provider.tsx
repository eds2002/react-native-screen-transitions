import { useFocusEffect } from "@react-navigation/native";
import { type ReactNode, useCallback, useMemo, useRef } from "react";
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
import useStableCallback from "../hooks/use-stable-callback";
import useStableCallbackValue from "../hooks/use-stable-callback-value";
import { AnimationStore } from "../stores/animation.store";
import { BoundStore } from "../stores/bounds.store";
import { prepareStyleForBounds } from "../utils/bounds/helpers/styles";
import createProvider from "../utils/create-provider";
import { type TransitionDescriptor, useKeys } from "./keys.provider";

interface MaybeMeasureAndStoreParams {
	onPress?: ((...args: unknown[]) => void) | undefined;
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
}

interface RegisterBoundsRenderProps {
	handleInitialLayout: () => void;
	captureActiveOnPress: () => void;
}

interface RegisterBoundsProviderProps {
	sharedBoundTag?: string;
	animatedRef: AnimatedRef<View>;
	style: StyleProps;
	onPress?: ((...args: unknown[]) => void) | undefined;
	children: (props: RegisterBoundsRenderProps) => ReactNode;
}

interface RegisterBoundsContextValue {
	updateSignal: SharedValue<number>;
}

/**
 * Gets the parent screen's route key for nested navigators.
 * Returns undefined if we're not inside a nested navigator.
 */
const getParentScreenKey = (current: TransitionDescriptor) => {
	const parent = current.navigation.getParent();
	if (!parent) return undefined;

	const parentState = parent.getState();
	if (!parentState?.routes) return undefined;

	// Check if our route key exists directly in parent's routes
	const existsInParent = parentState.routes.some(
		(r) => r.key === current.route.key,
	);

	// If we don't exist in parent's routes, we're nested inside the focused route
	if (!existsInParent && parentState.index !== undefined) {
		return parentState.routes[parentState.index]?.key;
	}

	return undefined;
};

/**
 * Handles initial layout measurement for destination elements.
 * Only measures if an animation is in progress (local or parent).
 */
const useInitialLayoutHandler = (params: {
	sharedBoundTag?: string;
	currentScreenKey: string;
	parentScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		currentScreenKey,
		parentScreenKey,
		maybeMeasureAndStore,
	} = params;

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);
	const isParentAnimating = parentScreenKey
		? AnimationStore.getAnimation(parentScreenKey, "animating")
		: null;

	const hasMeasuredOnLayout = useSharedValue(false);

	return useCallback(() => {
		"worklet";
		if (!sharedBoundTag || hasMeasuredOnLayout.value) return;
		if (!isAnimating.value && !isParentAnimating?.value) return;

		maybeMeasureAndStore({
			shouldSetSource: false,
			shouldSetDestination: true,
		});

		hasMeasuredOnLayout.value = true;
	}, [
		sharedBoundTag,
		hasMeasuredOnLayout,
		isAnimating,
		isParentAnimating,
		maybeMeasureAndStore,
	]);
};

/**
 * Measures non-pressable elements when screen becomes blurred.
 * Captures bounds right before transition starts.
 */
const useBlurMeasurement = (params: {
	sharedBoundTag?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { sharedBoundTag, maybeMeasureAndStore } = params;
	const isFocused = useRef(true);
	const hasCapturedSource = useRef(false);

	useFocusEffect(
		useCallback(() => {
			isFocused.current = true;
			hasCapturedSource.current = false;

			return () => {
				if (!sharedBoundTag) return;
				if (hasCapturedSource.current) return;

				isFocused.current = false;
				runOnUI(maybeMeasureAndStore)({ shouldSetSource: true });
			};
		}, [sharedBoundTag, maybeMeasureAndStore]),
	);

	return {
		markSourceCaptured: () => {
			hasCapturedSource.current = true;
		},
	};
};

/**
 * Syncs child measurements when parent updates.
 */
const useParentSyncReaction = (params: {
	parentContext: RegisterBoundsContextValue | null;
	maybeMeasureAndStore: (options?: MaybeMeasureAndStoreParams) => void;
}) => {
	const { parentContext, maybeMeasureAndStore } = params;

	useAnimatedReaction(
		() => parentContext?.updateSignal.value,
		(value) => {
			"worklet";
			if (value === 0 || value === undefined) return;
			maybeMeasureAndStore();
		},
	);
};

const { RegisterBoundsProvider, useRegisterBoundsContext } = createProvider(
	"RegisterBounds",
	{ guarded: false },
)<RegisterBoundsProviderProps, RegisterBoundsContextValue>(
	({ style, onPress, sharedBoundTag, animatedRef, children }) => {
		const { current } = useKeys();
		const currentScreenKey = current.route.key;
		const parentScreenKey = getParentScreenKey(current);

		// Context & signals
		const parentContext: RegisterBoundsContextValue | null =
			useRegisterBoundsContext();
		const ownSignal = useSharedValue(0);
		const updateSignal: SharedValue<number> =
			parentContext?.updateSignal ?? ownSignal;

		const isAnimating = AnimationStore.getAnimation(
			currentScreenKey,
			"animating",
		);
		const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);

		const emitUpdate = useStableCallbackValue(() => {
			"worklet";
			const isRoot = !parentContext;
			if (isRoot) updateSignal.value = updateSignal.value + 1;
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

				emitUpdate();

				// Always register occurrence
				BoundStore.registerOccurrence(
					sharedBoundTag,
					currentScreenKey,
					measured,
					preparedStyles,
				);

				// Set as source (on press or blur)
				if (shouldSetSource) {
					if (isAnimating.value) {
						const existing = BoundStore.getOccurrence(
							sharedBoundTag,
							currentScreenKey,
						);
						BoundStore.setLinkSource(
							sharedBoundTag,
							currentScreenKey,
							existing.bounds,
							preparedStyles,
							parentScreenKey,
						);
						return;
					}
					BoundStore.setLinkSource(
						sharedBoundTag,
						currentScreenKey,
						measured,
						preparedStyles,
						parentScreenKey,
					);
				}

				// Set as destination (on mount during animation)
				if (shouldSetDestination) {
					BoundStore.setLinkDestination(
						sharedBoundTag,
						currentScreenKey,
						measured,
						preparedStyles,
						parentScreenKey,
					);
				}

				if (onPress) runOnJS(onPress)();
			},
		);

		const handleInitialLayout = useInitialLayoutHandler({
			sharedBoundTag,
			currentScreenKey,
			parentScreenKey,
			maybeMeasureAndStore,
		});

		// Side effects
		const { markSourceCaptured } = useBlurMeasurement({
			sharedBoundTag,
			maybeMeasureAndStore,
		});

		useParentSyncReaction({ parentContext, maybeMeasureAndStore });

		const captureActiveOnPress = useStableCallback(() => {
			if (!sharedBoundTag) {
				onPress?.();
				return;
			}
			runOnUI(maybeMeasureAndStore)({ onPress, shouldSetSource: true });
			markSourceCaptured();
		});

		return {
			value: { updateSignal },
			children: children({ handleInitialLayout, captureActiveOnPress }),
		};
	},
);

export { RegisterBoundsProvider };
