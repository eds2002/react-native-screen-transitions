import type {
	BoundsAccessor,
	BoundsInterpolationProps,
	BoundsScopedAccessor,
} from "../../../types/bounds.types";
import type {
	BoundsComputeOptions,
	BoundsIdentity,
	BoundsIdentityInput,
	BoundsMathResult,
	BoundsStyleResult,
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

		const scoped: BoundsScopedAccessor = {
			styles: (options?: BoundsComputeOptions): BoundsStyleResult => {
				"worklet";
				return prepareBoundStyles({
					props,
					options: {
						...options,
						id: normalizedIdentity.id,
						group: normalizedIdentity.group,
					},
				}) as BoundsStyleResult;
			},
			math: <T extends BoundsComputeOptions = BoundsComputeOptions>(
				options?: T,
			): BoundsMathResult<T> => {
				"worklet";
				return prepareBoundStyles({
					props,
					options: {
						...options,
						id: normalizedIdentity.id,
						group: normalizedIdentity.group,
						raw: true,
					},
				}) as BoundsMathResult<T>;
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
