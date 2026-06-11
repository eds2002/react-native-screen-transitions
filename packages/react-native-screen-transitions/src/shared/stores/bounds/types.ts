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
export type BoundsPortalHost = "current-screen" | "paired-screen";
export type { ScreenKey } from "../../types/screen.types";

type BoundaryConfig = {
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

export type BoundsLinkStatus =
	| "source-incomplete"
	| "destination-incomplete"
	| "complete";

export type TagLinkSide = ScreenIdentifier & MeasuredEntry;
export type SourceTagLinkSide = TagLinkSide & {
	/** Where this boundary's portal content renders during the transition. */
	portalHost?: BoundsPortalHost;
};

type TagLinkBase = {
	group?: GroupKey;
	/** First captured source side exposed for public link inspection. */
	initialSource?: TagLinkSide;
	/** First attached destination side, used to compensate reveal closes after destination refreshes. */
	initialDestination?: TagLinkSide;
};

export type TagLink =
	| (TagLinkBase & {
			status: "source-incomplete";
			/** Source side once attached; null while destination captured first. */
			source: null;
			/** Destination side once attached; null while the source is still pending. */
			destination: TagLinkSide | null;
	  })
	| (TagLinkBase & {
			status: "destination-incomplete";
			/** Source side once attached; null while destination captured first. */
			source: SourceTagLinkSide;
			/** Destination side once attached; null while the source is still pending. */
			destination: null;
	  })
	| (TagLinkBase & {
			status: "complete";
			/** Source side once attached; null while destination captured first. */
			source: SourceTagLinkSide;
			/** Destination side once attached; null while the source is still pending. */
			destination: TagLinkSide;
	  });

export type BoundsLink = TagLink & {
	id: TagID;
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
	sourcePortalHost?: BoundsPortalHost;
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
