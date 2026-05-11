import type { EntryPatch, ScreenEntry, ScreenKey, TagState } from "../types";

type EntryPatchOptionalField = "boundaryConfig";

const ENTRY_PATCH_OPTIONAL_FIELDS = [
	"boundaryConfig",
] as const satisfies readonly EntryPatchOptionalField[];

export const ensureScreenEntry = (
	tagState: TagState,
	screenKey: ScreenKey,
): ScreenEntry => {
	"worklet";
	if (!tagState.screens[screenKey]) {
		tagState.screens[screenKey] = {
			bounds: null,
			styles: {},
		};
	}
	return tagState.screens[screenKey];
};

export const applyEntryPatch = (entry: ScreenEntry, patch: EntryPatch) => {
	"worklet";
	if (patch.bounds !== undefined) {
		entry.bounds = patch.bounds;
	}

	if (patch.styles !== undefined) {
		entry.styles = patch.styles ?? {};
	}

	const target = entry as Record<EntryPatchOptionalField, unknown>;
	for (let i = 0; i < ENTRY_PATCH_OPTIONAL_FIELDS.length; i++) {
		const field = ENTRY_PATCH_OPTIONAL_FIELDS[i];
		const value = patch[field];
		if (value === undefined) continue;

		if (value === null) {
			delete target[field];
		} else {
			target[field] = value;
		}
	}
};

export const findMatchingScreenEntry = (
	tagState: TagState | undefined,
	screenKey: ScreenKey,
): ScreenEntry | null => {
	"worklet";
	if (!tagState) return null;

	return tagState.screens[screenKey] ?? null;
};
