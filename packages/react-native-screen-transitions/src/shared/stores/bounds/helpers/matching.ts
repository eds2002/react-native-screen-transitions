import type { NavigatorKey, ScreenIdentifier, ScreenKey } from "../types";

export function matchesScreenKey(
	identifier: ScreenIdentifier | null | undefined,
	key: ScreenKey,
): boolean {
	"worklet";
	if (!identifier) return false;

	if (identifier.screenKey === key) return true;

	return identifier.ancestorKeys?.includes(key) ?? false;
}

export function matchesNavigatorKey(
	identifier: ScreenIdentifier | null | undefined,
	key: NavigatorKey,
): boolean {
	"worklet";
	if (!identifier) return false;

	if (identifier.navigatorKey === key) return true;

	return identifier.ancestorNavigatorKeys?.includes(key) ?? false;
}
