import type { StyleProps, TransformArrayItem } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";

type SharedValueLike = {
	_isReanimatedSharedValue: true;
	get?: () => unknown;
	value?: unknown;
};

const isSharedValueLike = (value: unknown): value is SharedValueLike => {
	"worklet";
	return (
		(value as Partial<SharedValueLike> | null)?._isReanimatedSharedValue ===
		true
	);
};

const resolveTransformValue = <T>(value: T): T | unknown => {
	"worklet";
	if (isSharedValueLike(value)) {
		return value.value;
	}

	if (Array.isArray(value)) {
		const resolved = [];
		for (let index = 0; index < value.length; index++) {
			const item = value[index];
			resolved.push(isSharedValueLike(item) ? item.value : item);
		}
		return resolved;
	}

	return value;
};

const resolveTransformItem = (
	value: TransformArrayItem,
): TransformArrayItem => {
	"worklet";
	if (typeof value === "object" && value !== null) {
		const resolved: Record<string, unknown> = {};
		const source = value as Record<string, unknown>;
		for (const key in source) {
			resolved[key] = resolveTransformValue(source[key]);
		}
		return resolved as TransformArrayItem;
	}

	return value;
};

const resolveLocalTransform = (
	transform: TransformArrayItem[],
): TransformArrayItem[] => {
	"worklet";
	const resolved: TransformArrayItem[] = [];

	for (let index = 0; index < transform.length; index++) {
		resolved.push(resolveTransformItem(transform[index]));
	}

	return resolved;
};

const flattenStyleObject = (
	style: unknown,
): Record<string, unknown> | undefined => {
	if (style === null || style === undefined || typeof style !== "object") {
		return undefined;
	}

	if (!Array.isArray(style)) {
		return style as Record<string, unknown>;
	}

	let flattened: Record<string, unknown> | undefined;
	for (let index = 0; index < style.length; index++) {
		const child = flattenStyleObject(style[index]);

		if (!child) {
			continue;
		}

		flattened = flattened ?? {};
		Object.assign(flattened, child);
	}

	return flattened;
};

export const getLocalTransformForSlotComposition = (
	style: unknown,
): TransformArrayItem[] | undefined => {
	const flattened = flattenStyleObject(style);
	const transform = flattened?.transform;

	return Array.isArray(transform)
		? (transform as TransformArrayItem[])
		: undefined;
};

export const composeSlotStyleWithLocalTransform = (
	slotStyle: StyleProps | undefined,
	localTransform: TransformArrayItem[] | undefined,
	boundsLocalTransform?: TransformArrayItem[],
): StyleProps => {
	"worklet";
	const resolvedSlotStyle = (slotStyle ?? NO_STYLES) as StyleProps;
	// The measured bounds snapshot supersedes the live local transform so bounds
	// geometry and payload scale are composed from the same measurement frame.
	const transformToCompose = boundsLocalTransform ?? localTransform;

	if (!transformToCompose?.length) {
		return resolvedSlotStyle;
	}

	const slotTransform = resolvedSlotStyle.transform;
	if (!Array.isArray(slotTransform)) {
		return resolvedSlotStyle;
	}

	return {
		...resolvedSlotStyle,
		transform: [
			...(slotTransform as TransformArrayItem[]),
			...resolveLocalTransform(transformToCompose),
		],
	};
};
