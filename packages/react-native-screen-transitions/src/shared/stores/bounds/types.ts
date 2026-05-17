import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { BoundsMethod } from "../../types/bounds.types";
import type { ScreenKey } from "../../types/screen.types";
import type {
	BoundsAnchor,
	BoundsScaleMode,
} from "../../utils/bounds/types/options";

export type TagID = string;
export type LinkKey = string;
export type GroupKey = string;
export type ScreenPairKey = string;
export type { ScreenKey } from "../../types/screen.types";

export type BoundaryConfig = {
	anchor?: BoundsAnchor;
	scaleMode?: BoundsScaleMode;
	target?: "bound" | "fullscreen" | MeasuredDimensions;
	method?: BoundsMethod;
};

export type Entry = {
	bounds: MeasuredDimensions | null;
	styles: StyleProps;
	boundaryConfig?: BoundaryConfig;
};

export type MeasuredEntry = Entry & {
	bounds: MeasuredDimensions;
};

export type EntryPatch = {
	bounds?: MeasuredDimensions | null;
	styles?: StyleProps | null;
	boundaryConfig?: BoundaryConfig | null;
};

export type ScreenIdentifier = {
	screenKey: ScreenKey;
};

export type TagLink = {
	group?: GroupKey;
	source: ScreenIdentifier & MeasuredEntry;
	/** Destination side once attached; null while the source is still pending. */
	destination: (ScreenIdentifier & MeasuredEntry) | null;
	/** First captured source side exposed for public link inspection. */
	initialSource?: ScreenIdentifier & MeasuredEntry;
	/** First attached destination side, used to compensate reveal closes after destination refreshes. */
	initialDestination?: ScreenIdentifier & MeasuredEntry;
};

export type ResolveTransitionContext = {
	currentScreenKey?: ScreenKey;
	previousScreenKey?: ScreenKey;
	nextScreenKey?: ScreenKey;
	entering: boolean;
};

export type ResolvedTransitionPair = {
	sourceBounds: MeasuredDimensions | null;
	destinationBounds: MeasuredDimensions | null;
	sourceStyles: StyleProps | null;
	destinationStyles: StyleProps | null;
	sourceScreenKey: ScreenKey | null;
	destinationScreenKey: ScreenKey | null;
};

export type ScreenEntry = Entry;

export type BoundaryState = {
	screens: Record<ScreenKey, ScreenEntry>;
};

export type LinkGroupState = {
	activeId: LinkKey;
	initialId?: LinkKey;
};

export type LinkPairState = {
	links: Record<LinkKey, TagLink>;
	groups: Record<GroupKey, LinkGroupState>;
};

export type LinkPairsState = Record<ScreenPairKey, LinkPairState>;

export type TagState = BoundaryState;
