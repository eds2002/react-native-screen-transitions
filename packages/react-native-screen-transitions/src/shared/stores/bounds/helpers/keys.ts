import type { ScreenIdentifier, ScreenKey } from "../types";

export function collectIdentifierKeys(
	identifier: ScreenIdentifier | null | undefined,
): ScreenKey[] {
	"worklet";
	if (!identifier) return [];

	const allKeys: ScreenKey[] = [identifier.screenKey];
	const ancestors = identifier.ancestorKeys;
	if (ancestors && ancestors.length > 0) {
		for (let i = 0; i < ancestors.length; i++) {
			const key = ancestors[i];
			if (!allKeys.includes(key)) {
				allKeys.push(key);
			}
		}
	}

	return allKeys;
}

export const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};
