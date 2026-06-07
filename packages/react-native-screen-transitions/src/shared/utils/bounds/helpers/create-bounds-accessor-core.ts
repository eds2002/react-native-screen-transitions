import {
	createPortalHostName,
	createPortalName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../../../components/integrations/teleport/utils";
import type {
	BoundsAccessor,
	BoundsInterpolationProps,
	BoundsPortalAccessor,
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
			portal: (): BoundsPortalAccessor => {
				"worklet";
				const portalId = createPortalName(tag ?? "");

				return {
					getHostId: (screenKey?: string) => {
						"worklet";
						return createPortalHostName(screenKey ?? props.current.route.key);
					},
					getPortalId: () => {
						"worklet";
						return portalId;
					},
					applyHostOffsets: (bounds) => {
						"worklet";
						return {
							transform: [
								{ translateY: bounds.pageY },
								{ translateX: bounds.pageX },
							],
						};
					},
					setPortalProps: ({ attach, hostId }) => {
						"worklet";
						return {
							hostName: attach
								? (hostId ?? createPortalHostName(props.current.route.key))
								: PORTAL_HOST_NAME_RESET_VALUE,
						};
					},
				};
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
