import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { setEntry } from "../../../stores/bounds/internals/entries";
import {
	setDestination,
	setSource,
} from "../../../stores/bounds/internals/links";

type ApplyMeasuredBoundsWritesParams = {
	sharedBoundTag: string;
	currentScreenKey: string;
	measured: MeasuredDimensions;
	preparedStyles: StyleProps;
	ancestorKeys: string[];
	navigatorKey?: string;
	ancestorNavigatorKeys?: string[];
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
		shouldSetSource,
		shouldUpdateSource,
		shouldSetDestination,
		shouldUpdateDestination,
		expectedSourceScreenKey,
	} = params;

	// Set the bounds entry on every measure to avoid any stale measurements
	// for the public read API.
	setEntry(sharedBoundTag, currentScreenKey, {
		bounds: measured,
	});

	if (shouldSetSource) {
		setSource(
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
		setSource(
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
		setDestination(
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
		setDestination(
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
