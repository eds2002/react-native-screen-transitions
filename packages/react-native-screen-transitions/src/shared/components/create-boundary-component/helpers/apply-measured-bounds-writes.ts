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
		);
	}

	if (shouldUpdateSource) {
		setSource(
			"refresh",
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
		);
	}

	if (shouldUpdateDestination) {
		setDestination(
			"refresh",
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			expectedSourceScreenKey,
		);
	}

	if (shouldSetDestination) {
		setDestination(
			"attach",
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			expectedSourceScreenKey,
		);
	}
};
