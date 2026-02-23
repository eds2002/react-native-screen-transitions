import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { BoundsMethod } from "../../types/bounds.types";
import type {
	BoundsAnchor,
	BoundsScaleMode,
} from "../../utils/bounds/types/options";

export type TagID = string;
export type ScreenKey = string;

export type BoundaryConfig = {
	anchor?: BoundsAnchor;
	scaleMode?: BoundsScaleMode;
	target?: "bound" | "fullscreen" | MeasuredDimensions;
	method?: BoundsMethod;
};

export type Snapshot = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

export type ScreenIdentifier = {
	screenKey: ScreenKey;
	ancestorKeys?: ScreenKey[];
};

export type TagLink = {
	source: ScreenIdentifier & Snapshot;
	destination: (ScreenIdentifier & Snapshot) | null;
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
	sourceScreenKey: ScreenKey | null;
	destinationScreenKey: ScreenKey | null;
	usedPending: boolean;
	usedSnapshotSource: boolean;
	usedSnapshotDestination: boolean;
};

export type SnapshotEntry = Snapshot & { ancestorKeys?: ScreenKey[] };

export type LinkIndexMap = Record<ScreenKey, number[]>;

export type TagLinkIndex = {
	latestPendingIndex: number;
	pendingIndices: number[];
	pendingBySourceKey: LinkIndexMap;
	anyBySourceKey: LinkIndexMap;
	completedBySourceKey: LinkIndexMap;
	completedByDestinationKey: LinkIndexMap;
};

export type TagState = {
	snapshots: Record<ScreenKey, SnapshotEntry>;
	linkStack: TagLink[];
	linkIndex: TagLinkIndex;
};

export type PresenceEntry = {
	count: number;
	ancestorKeys?: ScreenKey[];
	boundaryConfig?: BoundaryConfig;
};

export type PresenceState = Record<TagID, Record<ScreenKey, PresenceEntry>>;

export type GroupState = {
	activeId: string;
};
