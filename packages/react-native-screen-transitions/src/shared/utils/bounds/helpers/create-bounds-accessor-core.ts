import type {
	BoundsInterpolationProps,
	BoundsLinkOptions,
	BoundsScopedAccessors,
} from "../../../types/bounds.types";
import type { BoundsOptions, BoundsOptionsResult } from "../types/options";
import { createBoundTag } from "./create-bound-tag";
import { createInterpolators } from "./create-interpolators";
import { createLinkAccessor } from "./create-link-accessor";
import { prepareBoundStyles } from "./prepare-bound-styles";

export type BoundsComputeResult<T extends BoundsOptions> =
	BoundsOptionsResult<T> & BoundsScopedAccessors;

export type BoundsCompute = <T extends BoundsOptions>(
	options: T,
) => BoundsComputeResult<T>;

export type BoundsAccessorCore = BoundsCompute &
	ReturnType<typeof createLinkAccessor> &
	ReturnType<typeof createInterpolators>;

type ExtendBoundsResultParams<T extends BoundsOptions> = {
	target: BoundsComputeResult<T>;
	props: BoundsInterpolationProps;
	tag: string | undefined;
};

type CreateBoundsAccessorCoreParams = {
	getProps: () => BoundsInterpolationProps;
	extendResult?: <T extends BoundsOptions>(
		params: ExtendBoundsResultParams<T>,
	) => void;
};

const createBoundsAccessorParts = ({
	getProps,
	extendResult,
}: CreateBoundsAccessorCoreParams) => {
	"worklet";

	const { getMeasured, getSnapshot, getLink } = createLinkAccessor(getProps);
	const { interpolateStyle, interpolateBounds } = createInterpolators({
		getProps,
		getLink,
	});

	const computeBounds = (<T extends BoundsOptions>(
		params?: T,
	): BoundsComputeResult<T> => {
		"worklet";
		const props = getProps();
		const options = (params ?? { id: "" }) as T;
		const tag = createBoundTag({
			id: options.id,
			group: options.group,
		});
		const computed = prepareBoundStyles({
			props,
			options,
		});
		const scopedTag = tag ?? "";
		const target = Object.isExtensible(computed) ? computed : { ...computed };

		Object.defineProperties(target, {
			getMeasured: {
				value: (key?: string) => {
					"worklet";
					return getMeasured(scopedTag, key);
				},
				enumerable: false,
				configurable: true,
			},
			getSnapshot: {
				value: (key?: string) => {
					"worklet";
					return getSnapshot(scopedTag, key);
				},
				enumerable: false,
				configurable: true,
			},
			getLink: {
				value: (options?: BoundsLinkOptions) => {
					"worklet";
					return getLink(scopedTag, options);
				},
				enumerable: false,
				configurable: true,
			},
			interpolateStyle: {
				value: (
					property: Parameters<typeof interpolateStyle>[1],
					fallback?: number,
				) => {
					"worklet";
					return interpolateStyle(scopedTag, property, fallback);
				},
				enumerable: false,
				configurable: true,
			},
			interpolateBounds: {
				value: (
					property: Parameters<typeof interpolateBounds>[1],
					fallbackOrTargetKey?: Parameters<typeof interpolateBounds>[2],
					fallback?: number,
				) => {
					"worklet";
					return interpolateBounds(
						scopedTag,
						property,
						fallbackOrTargetKey,
						fallback,
					);
				},
				enumerable: false,
				configurable: true,
			},
		});

		extendResult?.({
			target: target as BoundsComputeResult<T>,
			props,
			tag,
		});

		return target as BoundsComputeResult<T>;
	}) as BoundsCompute;

	return {
		computeBounds,
		getMeasured,
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	};
};

export const createBoundsAccessorCore = (
	params: CreateBoundsAccessorCoreParams,
): BoundsAccessorCore => {
	"worklet";

	const {
		computeBounds,
		getMeasured,
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	} = createBoundsAccessorParts(params);

	return Object.assign(computeBounds, {
		getMeasured,
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	}) as BoundsAccessorCore;
};
