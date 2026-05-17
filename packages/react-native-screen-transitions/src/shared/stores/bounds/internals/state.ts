import { makeMutable } from "react-native-reanimated";
import type { LinkPairsState, TagID, TagState } from "../types";

export type BoundaryEntriesState = Record<TagID, TagState>;

export const boundaryRegistry = makeMutable<BoundaryEntriesState>({});

/**
 * Transition links scoped per screen pair.
 *
 * Links used to live in a flat array that acted like a global history. To find
 * the right link, we had to scan for the latest pending or completed entry that
 * matched a screen, which made refreshes and rapid triggers tricky to handle.
 *
 * Keying by screen pair fixes that: each transition lives under its pair, and
 * every shared boundary id maps to a single link in that pair. Refreshing the
 * source or destination just overwrites the same slot instead of pushing a new
 * history entry.
 *
 * Example:
 *
 * {
 *   "a<>b": {
 *     links: {
 *       "unique-tag-1": { source: ..., destination: ... },
 *     },
 *   },
 * }
 */
export const pairs = makeMutable<LinkPairsState>({});
