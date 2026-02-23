import type { ScreenIdentifier, ScreenKey } from "../types";

export function matchesScreenKey(
	identifier: ScreenIdentifier | null | undefined,
	key: ScreenKey,
): boolean {
	"worklet";
	if (!identifier) return false;

	if (identifier.screenKey === key) return true;

	return identifier.ancestorKeys?.includes(key) ?? false;
}
