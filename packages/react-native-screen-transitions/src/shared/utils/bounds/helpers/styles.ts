import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";
import { isSharedValue } from "react-native-reanimated";
import type { Any } from "../../../types/utils.types";

type AnyStyle = ViewStyle | TextStyle | ImageStyle;
type StyleValue = StyleProp<AnyStyle>;
type PlainStyleObject = Record<string, Any>;

function mergeStyleArrays<T extends StyleValue>(style: T): T {
	"worklet";

	// Early returns for non-objects
	if (style === null || style === undefined || typeof style !== "object") {
		return style;
	}

	// If not an array, return as-is
	if (!Array.isArray(style)) {
		return style;
	}

	// Merge array of styles into single object
	const merged: PlainStyleObject = {};
	for (let i = 0; i < style.length; i++) {
		const currentStyle = mergeStyleArrays(style[i] as StyleValue);
		if (currentStyle && typeof currentStyle === "object") {
			Object.assign(merged, currentStyle);
		}
	}
	return merged as T;
}

function stripNonSerializable<T>(value: T): T | undefined {
	if (isSharedValue(value)) return value;

	if (Array.isArray(value)) {
		return value.map(stripNonSerializable) as T;
	}

	if (value && typeof value === "object") {
		const cleaned: PlainStyleObject = {};
		for (const key in value) {
			if (key === "current") continue;

			const cleanedValue = stripNonSerializable(value[key]);
			if (cleanedValue !== undefined) {
				cleaned[key] = cleanedValue;
			}
		}
		return cleaned as T;
	}

	if (typeof value === "function") {
		return undefined;
	}

	return value;
}

export function prepareStyleForBounds(
	style: StyleValue | undefined,
): PlainStyleObject {
	if (!style) return {};

	const flattened = mergeStyleArrays(style);
	const serializable = stripNonSerializable(flattened);

	return serializable || {};
}
