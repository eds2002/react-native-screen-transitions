import { type GroupsState, groups } from "./state";

function setGroupActiveId(group: string, id: string) {
	"worklet";
	groups.modify(<T extends GroupsState>(state: T): T => {
		"worklet";
		const mutableState = state as GroupsState;
		mutableState[group] = {
			activeId: id,
		};
		return state;
	});
}

function getGroupActiveId(group: string): string | null {
	"worklet";
	return groups.get()[group]?.activeId ?? null;
}

export { getGroupActiveId, setGroupActiveId };
