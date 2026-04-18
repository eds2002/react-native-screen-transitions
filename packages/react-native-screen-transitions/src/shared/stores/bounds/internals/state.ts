import { makeMutable } from "react-native-reanimated";
import type { GroupState, TagID, TagState } from "../types";

export type RegistryState = Record<TagID, TagState>;
export type GroupsState = Record<string, GroupState>;

export const registry = makeMutable<RegistryState>({});
export const groups = makeMutable<GroupsState>({});
