import type { ScreenIdentifier, ScreenKey } from "../types";

export function matchesScreenKey(
	identifier: ScreenIdentifier | null | undefined,
	key: ScreenKey,
): boolean {
	"worklet";
	if (!identifier) return false;

	return identifier.screenKey === key;
}
