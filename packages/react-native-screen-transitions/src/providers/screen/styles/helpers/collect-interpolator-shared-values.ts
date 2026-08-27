import type { SharedValue } from "react-native-reanimated";
import type { ScreenStyleInterpolator } from "../../../../types/animation.types";

type WorkletClosure = Record<string, unknown>;

type ClosureCarrier = {
	__closure?: WorkletClosure;
};

type SharedValueLike = SharedValue<unknown> & {
	_isReanimatedSharedValue: true;
};

const isSharedValueLike = (value: unknown): value is SharedValueLike =>
	(value as Partial<SharedValueLike> | null)?._isReanimatedSharedValue === true;

const getWorkletClosure = (value: unknown): WorkletClosure | undefined => {
	if (
		value === null ||
		(typeof value !== "object" && typeof value !== "function")
	) {
		return undefined;
	}

	const closure = (value as Partial<ClosureCarrier>).__closure;
	return closure && typeof closure === "object" ? closure : undefined;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	value !== null &&
	typeof value === "object" &&
	Object.getPrototypeOf(value) === Object.prototype;

export const collectInterpolatorSharedValues = (
	interpolators: Array<ScreenStyleInterpolator | undefined>,
): SharedValue<unknown>[] => {
	const sharedValues: SharedValue<unknown>[] = [];
	const seen = new Set<unknown>();

	const visit = (value: unknown) => {
		if (value === null || value === undefined || seen.has(value)) {
			return;
		}
		seen.add(value);

		if (isSharedValueLike(value)) {
			sharedValues.push(value);
			return;
		}

		if (typeof value === "function") {
			visit(getWorkletClosure(value));
			return;
		}

		if (Array.isArray(value)) {
			for (let index = 0; index < value.length; index++) {
				visit(value[index]);
			}
			return;
		}

		if (isPlainObject(value)) {
			for (const item of Object.values(value)) {
				visit(item);
			}
		}
	};

	for (let index = 0; index < interpolators.length; index++) {
		visit(getWorkletClosure(interpolators[index]));
	}

	return sharedValues;
};
