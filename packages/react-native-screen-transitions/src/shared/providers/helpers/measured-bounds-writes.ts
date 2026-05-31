import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { setEntry } from "../../stores/bounds/internals/entries";
import { setDestination, setSource } from "../../stores/bounds/internals/links";
import type { ScreenPairKey } from "../../stores/bounds/types";

type LinkWrite =
	| {
			type: "source";
			pairKey: ScreenPairKey;
	  }
	| {
			type: "destination";
			pairKey: ScreenPairKey;
	  };

type ApplyMeasuredBoundsWritesParams = {
	entryTag: string;
	linkId: string;
	group?: string;
	currentScreenKey: string;
	measured: MeasuredDimensions;
	preparedStyles: StyleProps;
	linkWrite?: LinkWrite;
};

export const applyMeasuredBoundsWrites = (
	params: ApplyMeasuredBoundsWritesParams,
) => {
	"worklet";
	const {
		entryTag,
		linkId,
		group,
		currentScreenKey,
		measured,
		preparedStyles,
		linkWrite,
	} = params;

	// Set the bounds entry on every measure to avoid any stale measurements
	// for the public read API.
	setEntry(entryTag, currentScreenKey, {
		bounds: measured,
	});

	if (linkWrite?.type === "source") {
		setSource(
			linkWrite.pairKey,
			linkId,
			currentScreenKey,
			measured,
			preparedStyles,
			group,
		);
	}

	if (linkWrite?.type === "destination") {
		setDestination(
			linkWrite.pairKey,
			linkId,
			currentScreenKey,
			measured,
			preparedStyles,
			group,
		);
	}
};
