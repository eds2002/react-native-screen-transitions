import type { BaseStackRoute } from "../../types/stack.types";
import { error, logger } from "../logger";

/**
 * Checks if a value is a plain object
 */
export const isPlainObject = (
	value: unknown,
): value is Record<string, unknown> => {
	if (!value || typeof value !== "object") return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

/**
 * Validates that a value is worklet serializable.
 * Throws with a clear path if invalid values are found.
 */
export const assertWorkletSerializable = (
	value: unknown,
	label: string,
	seen = new WeakSet<object>(),
	path = label,
): void => {
	if (!__DEV__) return;

	// Primitives are always safe
	if (
		value === null ||
		value === undefined ||
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return;
	}

	// Functions are not serializable
	if (typeof value === "function") {
		logger.error(
			`${label} must be worklet-serializable. Invalid function at: ${path}`,
		);
		throw error(
			`${label} must be worklet-serializable. Invalid function at: ${path}`,
		);
	}

	// Symbols are not serializable
	if (typeof value === "symbol") {
		logger.error(
			`${label} must be worklet-serializable. Invalid symbol at: ${path}`,
		);
		throw error(
			`${label} must be worklet-serializable. Invalid symbol at: ${path}`,
		);
	}

	// Must be an object at this point
	if (typeof value !== "object") {
		logger.error(
			`${label} must be worklet-serializable. Invalid type "${typeof value}" at: ${path}`,
		);
		throw error(
			`${label} must be worklet-serializable. Invalid type "${typeof value}" at: ${path}`,
		);
	}

	// Check for circular references
	if (seen.has(value)) {
		logger.error(
			`${label} must be worklet-serializable. Circular reference at: ${path}`,
		);
		throw error(
			`${label} must be worklet-serializable. Circular reference at: ${path}`,
		);
	}
	seen.add(value);

	// Arrays: validate all elements
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			assertWorkletSerializable(value[i], label, seen, `${path}[${i}]`);
		}
		return;
	}

	// Must be a plain object
	if (!isPlainObject(value)) {
		const constructorName = value.constructor?.name ?? "unknown";
		logger.error(
			`${label} must be worklet-serializable. Invalid ${constructorName} instance at: ${path}`,
		);
		throw error(
			`${label} must be worklet-serializable. Invalid ${constructorName} instance at: ${path}`,
		);
	}

	// Validate all keys of the plain object
	for (const key of Object.keys(value)) {
		assertWorkletSerializable(value[key], label, seen, `${path}.${key}`);
	}
};

/**
 * Creates a plain, serializable route object for worklet consumption.
 * Only includes params if they are a plain object (no functions or class instances).
 */
export const toPlainRoute = (route: BaseStackRoute): BaseStackRoute => {
	let plainParams: object | undefined;

	if (route.params != null && typeof route.params === "object") {
		// Check if params is a plain object (not a class instance, array, etc.)
		const proto = Object.getPrototypeOf(route.params);
		if (proto === Object.prototype || proto === null) {
			plainParams = { ...route.params };
		}
	}

	return {
		key: route.key,
		name: route.name,
		params: plainParams,
	};
};
