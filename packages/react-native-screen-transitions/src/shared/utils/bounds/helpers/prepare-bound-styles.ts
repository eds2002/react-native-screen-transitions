import { getEntry } from "../../../stores/bounds/internals/entries";
import { setActiveGroupId } from "../../../stores/bounds/internals/links";
import type { ResolvedTransitionPair } from "../../../stores/bounds/types";
import type { BoundsInterpolationProps } from "../../../types/bounds.types";
import { DEFAULT_BOUNDS_OPTIONS } from "../constants";
import type {
	BoundId,
	BoundsOptions,
	BoundsOptionsResult,
} from "../types/options";
import { createBoundTag } from "./create-bound-tag";
import { resolveBoundsPairKey } from "./resolve-bounds-pair-key";
import { computeBoundStyles } from "./styles/compute";

type BaseInterpolatorProps = BoundsInterpolationProps;

type ComputeResolvedBoundsStylesParams<T extends BoundsOptions> = {
	props: BaseInterpolatorProps;
	options: T;
	resolvedPair?: ResolvedTransitionPair;
	syncGroupActiveId?: boolean;
};

type BuildBoundsOptionsParams = {
	props: BoundsInterpolationProps;
	id?: BoundId;
	group?: string;
	overrides?: Partial<BoundsOptions>;
};

const buildBoundsOptions = ({
	props,
	id,
	group,
	overrides,
}: BuildBoundsOptionsParams): BoundsOptions => {
	"worklet";

	const tag = createBoundTag({ id, group });
	const currentScreenKey = props.current?.route.key;

	const boundaryConfig =
		tag && currentScreenKey
			? (getEntry(tag, currentScreenKey)?.boundaryConfig ?? null)
			: null;

	const resolved = {
		...DEFAULT_BOUNDS_OPTIONS,
		...(boundaryConfig ?? {}),
		...(overrides ?? {}),
		id: tag ?? "",
		group,
	};

	return resolved;
};

const syncActiveGroupId = (params: {
	props: BoundsInterpolationProps;
	id?: BoundId;
	group?: string;
}) => {
	"worklet";
	const { props, id, group } = params;
	if (id == null || id === "" || !group) return;

	const pairKey = resolveBoundsPairKey(props);
	if (!pairKey) return;

	setActiveGroupId(pairKey, group, String(id));
};

export const prepareBoundStyles = <T extends BoundsOptions>({
	props,
	options,
	resolvedPair,
	syncGroupActiveId = false,
}: ComputeResolvedBoundsStylesParams<T>): BoundsOptionsResult<T> => {
	"worklet";

	if (syncGroupActiveId) {
		syncActiveGroupId({
			props,
			id: options.id,
			group: options.group,
		});
	}

	const resolved = buildBoundsOptions({
		props,
		id: options.id,
		group: options.group,
		overrides: options,
	});

	return computeBoundStyles(
		{
			id: resolved.id,
			previous: props.previous,
			current: props.current,
			next: props.next,
			progress: props.progress,
			dimensions: props.layouts.screen,
		},
		resolved,
		resolvedPair,
	) as BoundsOptionsResult<T>;
};
