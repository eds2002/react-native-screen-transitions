import type { BoundaryConfig, ScreenKey, TagID } from "../types";
import { groups, presence } from "./state";

function registerBoundaryPresence(
	tag: TagID,
	screenKey: ScreenKey,
	ancestorKeys?: ScreenKey[],
	boundaryConfig?: BoundaryConfig,
) {
	"worklet";
	const current = presence.value;
	const tagEntries = current[tag] ?? {};
	const currentEntry = tagEntries[screenKey];

	presence.value = {
		...current,
		[tag]: {
			...tagEntries,
			[screenKey]: {
				count: (currentEntry?.count ?? 0) + 1,
				ancestorKeys: ancestorKeys ?? currentEntry?.ancestorKeys,
				boundaryConfig: boundaryConfig ?? currentEntry?.boundaryConfig,
			},
		},
	};
}

function unregisterBoundaryPresence(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	const current = presence.value;
	const tagEntries = current[tag];
	if (!tagEntries) return;

	const currentEntry = tagEntries[screenKey];
	if (!currentEntry) return;

	const nextCount = currentEntry.count - 1;

	if (nextCount > 0) {
		presence.value = {
			...current,
			[tag]: {
				...tagEntries,
				[screenKey]: {
					...currentEntry,
					count: nextCount,
				},
			},
		};
		return;
	}

	const { [screenKey]: _removed, ...remainingForTag } = tagEntries;
	if (Object.keys(remainingForTag).length === 0) {
		const { [tag]: _removedTag, ...remainingPresence } = current;
		presence.value = remainingPresence;
		return;
	}

	presence.value = {
		...current,
		[tag]: remainingForTag,
	};
}

function hasBoundaryPresence(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const tagEntries = presence.value[tag];
	if (!tagEntries) return false;

	const direct = tagEntries[screenKey];
	if (direct && direct.count > 0) return true;

	for (const entryScreenKey in tagEntries) {
		const entry = tagEntries[entryScreenKey];
		if (entry.ancestorKeys?.includes(screenKey)) {
			return true;
		}
	}

	return false;
}

function getBoundaryPresence() {
	"worklet";
	return presence;
}

function getBoundaryConfig(
	tag: TagID,
	screenKey: ScreenKey,
): BoundaryConfig | null {
	"worklet";
	const tagEntries = presence.value[tag];
	if (!tagEntries) return null;

	const direct = tagEntries[screenKey];
	if (direct && direct.count > 0) {
		return direct.boundaryConfig ?? null;
	}

	for (const entryScreenKey in tagEntries) {
		const entry = tagEntries[entryScreenKey];
		if (entry.count <= 0) continue;
		if (entry.ancestorKeys?.includes(screenKey)) {
			return entry.boundaryConfig ?? null;
		}
	}

	return null;
}

function setGroupActiveId(group: string, id: string) {
	"worklet";
	groups.value = { ...groups.value, [group]: { activeId: id } };
}

function getGroupActiveId(group: string): string | null {
	"worklet";
	return groups.value[group]?.activeId ?? null;
}

function getGroups() {
	"worklet";
	return groups;
}

export {
	registerBoundaryPresence,
	unregisterBoundaryPresence,
	hasBoundaryPresence,
	getBoundaryPresence,
	getBoundaryConfig,
	setGroupActiveId,
	getGroupActiveId,
	getGroups,
};
