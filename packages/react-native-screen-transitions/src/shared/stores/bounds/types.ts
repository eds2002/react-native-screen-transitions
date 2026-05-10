import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { BoundsMethod } from "../../types/bounds.types";
import type {
	BoundsAnchor,
	BoundsScaleMode,
} from "../../utils/bounds/types/options";

export type TagID = string;
export type ScreenKey = string;
export type NavigatorKey = string;

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
	ancestorKeys?: ScreenKey[];
	navigatorKey?: NavigatorKey;
	ancestorNavigatorKeys?: NavigatorKey[];
};

export type MeasuredEntry = Entry & {
	bounds: MeasuredDimensions;
};

export type EntryPatch = {
	bounds?: MeasuredDimensions | null;
	styles?: StyleProps | null;
	boundaryConfig?: BoundaryConfig | null;
	ancestorKeys?: ScreenKey[] | null;
	navigatorKey?: NavigatorKey | null;
	ancestorNavigatorKeys?: NavigatorKey[] | null;
};

export type ScreenIdentifier = {
	screenKey: ScreenKey;
	ancestorKeys?: ScreenKey[];
	navigatorKey?: NavigatorKey;
	ancestorNavigatorKeys?: NavigatorKey[];
};

export type TagLink = {
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

export type TagState = {
	screens: Record<ScreenKey, ScreenEntry>;
	linkStack: TagLink[];
};

export type GroupState = {
	/** Latest requested group member id from mounted grouped bounds. */
	activeId: string;
	/** Group member id that started the current linked transition. */
	initialId?: string;
};
