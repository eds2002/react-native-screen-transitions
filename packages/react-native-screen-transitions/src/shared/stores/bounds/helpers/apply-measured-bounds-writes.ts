import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { BoundStore } from "..";

type ApplyMeasuredBoundsWritesParams = {
	sharedBoundTag: string;
	currentScreenKey: string;
	measured: MeasuredDimensions;
	preparedStyles: StyleProps;
	ancestorKeys: string[];
	navigatorKey?: string;
	ancestorNavigatorKeys?: string[];
	shouldWriteEntry?: boolean;
	shouldSetSource?: boolean;
	shouldUpdateSource?: boolean;
	shouldSetDestination?: boolean;
	shouldUpdateDestination?: boolean;
	expectedSourceScreenKey?: string;
};

export const applyMeasuredBoundsWrites = (
	params: ApplyMeasuredBoundsWritesParams,
) => {
	"worklet";
	const {
		sharedBoundTag,
		currentScreenKey,
		measured,
		preparedStyles,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
		shouldWriteEntry,
		shouldSetSource,
		shouldUpdateSource,
		shouldSetDestination,
		shouldUpdateDestination,
		expectedSourceScreenKey,
	} = params;

	if (shouldWriteEntry) {
		BoundStore.entry.set(sharedBoundTag, currentScreenKey, {
			bounds: measured,
			styles: preparedStyles,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
		});
	}

	if (shouldSetSource) {
		BoundStore.link.setSource(
			"capture",
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
		);
	}

	if (shouldUpdateSource) {
		BoundStore.link.setSource(
			"refresh",
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
		);
	}

	if (shouldUpdateDestination) {
		BoundStore.link.setDestination(
			"refresh",
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			ancestorKeys,
			expectedSourceScreenKey,
			navigatorKey,
			ancestorNavigatorKeys,
		);
	}

	if (shouldSetDestination) {
		BoundStore.link.setDestination(
			"attach",
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			ancestorKeys,
			expectedSourceScreenKey,
			navigatorKey,
			ancestorNavigatorKeys,
		);
	}
};
