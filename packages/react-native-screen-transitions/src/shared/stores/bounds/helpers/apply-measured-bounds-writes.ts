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
	shouldRegisterSnapshot?: boolean;
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
		shouldRegisterSnapshot,
		shouldSetSource,
		shouldUpdateSource,
		shouldSetDestination,
		shouldUpdateDestination,
		expectedSourceScreenKey,
	} = params;

	if (shouldRegisterSnapshot) {
		BoundStore.registerSnapshot(
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
		);
	}

	if (shouldSetSource) {
		BoundStore.setLinkSource(
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
		BoundStore.updateLinkSource(
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
		BoundStore.updateLinkDestination(
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
		BoundStore.setLinkDestination(
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
