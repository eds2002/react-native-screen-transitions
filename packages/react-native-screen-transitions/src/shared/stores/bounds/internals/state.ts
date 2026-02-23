import { makeMutable } from "react-native-reanimated";
import type {
	GroupState,
	PresenceState,
	TagID,
	TagLinkIndex,
	TagState,
} from "../types";

export const createEmptyLinkIndex = (): TagLinkIndex => ({
	latestPendingIndex: -1,
	pendingIndices: [],
	pendingBySourceKey: {},
	anyBySourceKey: {},
	completedBySourceKey: {},
	completedByDestinationKey: {},
});

export const createEmptyTagState = (): TagState => ({
	snapshots: {},
	linkStack: [],
	linkIndex: createEmptyLinkIndex(),
});

export const registry = makeMutable<Record<TagID, TagState>>({});
export const presence = makeMutable<PresenceState>({});
export const groups = makeMutable<Record<string, GroupState>>({});

const RESOLVER_LOG_PREFIX = "[bounds:resolver]";
const ENABLE_RESOLVER_DEBUG_LOGS = false;

export function debugResolverLog(message: string) {
	"worklet";
	if (!ENABLE_RESOLVER_DEBUG_LOGS) return;
	console.warn(`${RESOLVER_LOG_PREFIX} ${message}`);
}
