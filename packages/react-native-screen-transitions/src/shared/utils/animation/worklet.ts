import type { BaseStackRoute } from "../../types/stack.types";

/**
 * Deep-clones a value, ensuring every object in the tree has Object.prototype.
 * Handles null-prototype objects created by expo-router during deep linking.
 * Non-plain objects (class instances, functions, symbols) are omitted.
 */
export const toPlainValue = (value: unknown): unknown => {
	if (value === null || value === undefined) return value;

	const type = typeof value;
	if (type === "string" || type === "number" || type === "boolean")
		return value;

	if (type === "function" || type === "symbol") return undefined;

	if (type !== "object") return undefined;

	if (Array.isArray(value)) {
		return value.map(toPlainValue);
	}

	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) {
		return undefined;
	}

	const obj = value as Record<string, unknown>;
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(obj)) {
		result[key] = toPlainValue(obj[key]);
	}
	return result;
};

/**
 * Creates a plain, serializable route object for worklet consumption.
 * Deep-clones params to ensure all nested objects have Object.prototype
 * (expo-router can produce null-prototype objects during deep linking).
 */
export const toPlainRoute = (route: BaseStackRoute): BaseStackRoute => {
	return {
		key: route.key,
		name: route.name,
		params: toPlainValue(route.params) as object | undefined,
	};
};
