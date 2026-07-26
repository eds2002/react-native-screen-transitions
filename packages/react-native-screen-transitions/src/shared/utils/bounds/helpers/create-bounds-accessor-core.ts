import { NO_STYLES } from "../../../constants";
import type {
	BoundsAccessor,
	BoundsInterpolationProps,
	BoundsScopedAccessor,
} from "../../../types/bounds.types";
import type {
	BoundsComputeOptions,
	BoundsIdentity,
	BoundsIdentityInput,
	BoundsStyleResult,
	BoundsValuesResult,
} from "../types/options";
import { createBoundTag, normalizeBoundIdentity } from "./create-bound-tag";
import { createLinkAccessor } from "./create-link-accessor";
import { prepareBoundStyles, syncActiveGroupId } from "./prepare-bound-styles";

type ExtendBoundsResultParams = {
	target: BoundsScopedAccessor;
	identity: BoundsIdentity;
	props: BoundsInterpolationProps;
	tag: string | undefined;
};

type CreateBoundsAccessorCoreParams = {
	getProps: () => BoundsInterpolationProps;
	extendResult?: (params: ExtendBoundsResultParams) => void;
};

const createBoundsAccessorParts = ({
	getProps,
	extendResult,
}: CreateBoundsAccessorCoreParams) => {
	"worklet";

	const { getLink } = createLinkAccessor(getProps);

	const createScopedBounds = ((
		identity: BoundsIdentityInput,
	): BoundsScopedAccessor => {
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
			math: <T extends BoundsComputeOptions = BoundsComputeOptions>(
				options?: T,
			) => {
				"worklet";
				return getValues(options);
			},
			link: (id?: BoundsIdentityInput) => {
				"worklet";
				const linkIdentity =
					id == null
						? normalizedIdentity
						: normalizeBoundIdentity(id, normalizedIdentity.group);
				const linkTag = createBoundTag(linkIdentity);
				return getLink(linkTag ?? "");
			},
		} as BoundsScopedAccessor;

		extendResult?.({
			target: scoped,
			identity: normalizedIdentity,
			props,
			tag,
		});

		return scoped;
	}) as BoundsAccessor;

	return {
		createScopedBounds,
	};
};

export const createBoundsAccessorCore = (
	params: CreateBoundsAccessorCoreParams,
): BoundsAccessor => {
	"worklet";

	const { createScopedBounds } = createBoundsAccessorParts(params);

	return createScopedBounds;
};
