import { makeMutable } from "react-native-reanimated";
import type { GroupState, PresenceState, TagID, TagState } from "../types";

export const createEmptyTagState = (): TagState => {
	"worklet";
	return {
		snapshots: {},
		linkStack: [],
	};
};

export type RegistryState = Record<TagID, TagState>;
export type GroupsState = Record<string, GroupState>;

export const registry = makeMutable<RegistryState>({});
export const presence = makeMutable<PresenceState>({});
export const groups = makeMutable<GroupsState>({});
