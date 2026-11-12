import type {
	GroupKey,
	MeasuredBounds,
	TagLink,
} from "../../types/bounds.types";
import type { ScreenKey } from "../../types/screen.types";

export type LinkKey = string;
export type ScreenPairKey = string;

/**
 * A boundary's identity, carried as one value instead of the
 * `{ tag, linkKey, group }` clump that used to thread through every hook.
 *
 * - `tag`: the combined entry tag (`group:linkKey` when grouped, else `linkKey`).
 * - `linkKey`: the bare member key used to address links within a screen pair.
 * - `group`: the optional collection name.
 */
export interface BoundTag {
	tag: string;
	linkKey: LinkKey;
	group?: GroupKey;
}
export type { ScreenKey } from "../../types/screen.types";

export type ResolveTransitionContext = {
	currentScreenKey?: ScreenKey;
	previousScreenKey?: ScreenKey;
	nextScreenKey?: ScreenKey;
	entering: boolean;
};

export type ResolvedTransitionPair = {
	sourceBounds: MeasuredBounds | null;
	destinationBounds: MeasuredBounds | null;
	sourceScreenKey: ScreenKey | null;
	destinationScreenKey: ScreenKey | null;
	/** Each end's look when it was measured (it travels with the element: see visual-styles). */
	sourceLook: Record<string, unknown> | null;
	destinationLook: Record<string, unknown> | null;
};

export type LinkGroupState = {
	activeId: LinkKey;
	initialId?: LinkKey;
};

export type LinkPairState = {
	links: Record<LinkKey, TagLink>;
	groups: Record<GroupKey, LinkGroupState>;
	sourceRequests?: Record<LinkKey, true>;
};

export type LinkPairsState = Record<ScreenPairKey, LinkPairState>;
