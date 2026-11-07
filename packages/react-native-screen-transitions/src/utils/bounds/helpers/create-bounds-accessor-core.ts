import { NO_STYLES } from "../../../constants";
import type {
	BoundsAccessor,
	BoundsInterpolationProps,
	BoundsScopedAccessor,
} from "../../../types/bounds.types";
import type {
	BoundsComputeOptions,
	BoundsIdentityInput,
	BoundsStyleResult,
	BoundsValuesResult,
} from "../types/options";
import { createBoundTag, normalizeBoundIdentity } from "./create-bound-tag";
import { getBoundsLink } from "./get-bounds-link";
import { prepareBoundStyles, syncActiveGroupId } from "./prepare-bound-styles";

type ExtendBoundsResultParams = {
	target: BoundsScopedAccessor;
	props: BoundsInterpolationProps;
	tag: string | undefined;
};

type CreateBoundsAccessorCoreParams = {
	getProps: () => BoundsInterpolationProps;
	extendResult?: (params: ExtendBoundsResultParams) => void;
};

/** The `bounds` accessor interpolators receive: `bounds(id)` scopes it to one bound. */
export const createBoundsAccessorCore = ({
	getProps,
	extendResult,
}: CreateBoundsAccessorCoreParams): BoundsAccessor => {
	"worklet";

	return ((identity: BoundsIdentityInput): BoundsScopedAccessor => {
		"worklet";
		const props = getProps();
		const normalizedIdentity = normalizeBoundIdentity(identity);
		const tag = createBoundTag(normalizedIdentity);
		syncActiveGroupId({
			props,
			id: normalizedIdentity.id,
			group: normalizedIdentity.group,
		});
		const getValues = <T extends BoundsComputeOptions = BoundsComputeOptions>(
			options?: T,
		): BoundsValuesResult<T> => {
			"worklet";
			return prepareBoundStyles({
				props,
				options: {
					...options,
					id: normalizedIdentity.id,
					group: normalizedIdentity.group,
					raw: true,
				},
			}) as BoundsValuesResult<T>;
		};

		const scoped: BoundsScopedAccessor = {
			styles: (options?: BoundsComputeOptions): BoundsStyleResult => {
				"worklet";
				// Keep the component at its base layout for pre-animation refresh
				// measurement, then remove generated styles again after settlement.
				if (!props.active.animating) {
					return NO_STYLES;
				}

				return prepareBoundStyles({
					props,
					options: {
						...options,
						id: normalizedIdentity.id,
						group: normalizedIdentity.group,
					},
				}) as BoundsStyleResult;
			},
			values: getValues,
			link: (id?: BoundsIdentityInput) => {
				"worklet";
				const linkIdentity =
					id == null
						? normalizedIdentity
						: normalizeBoundIdentity(id, normalizedIdentity.group);
				return getBoundsLink(props, createBoundTag(linkIdentity) ?? "");
			},
		} as BoundsScopedAccessor;

		extendResult?.({ target: scoped, props, tag });

		return scoped;
	}) as BoundsAccessor;
};
