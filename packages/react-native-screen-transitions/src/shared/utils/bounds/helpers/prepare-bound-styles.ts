import {
	getGroupActiveId,
	setGroupActiveId,
} from "../../../stores/bounds/internals/groups";
import { getEntry } from "../../../stores/bounds/internals/registry";
import type { ResolvedTransitionPair } from "../../../stores/bounds/types";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import { DEFAULT_BOUNDS_OPTIONS } from "../constants";
import type {
	BoundId,
	BoundsOptions,
	BoundsOptionsResult,
} from "../types/options";
import { createBoundTag } from "./create-bound-tag";
import { computeBoundStyles } from "./styles/compute";

type BaseInterpolatorProps = Omit<ScreenInterpolationProps, "bounds">;

type ComputeResolvedBoundsStylesParams<T extends BoundsOptions> = {
	props: BaseInterpolatorProps;
	options: T;
	resolvedPair?: ResolvedTransitionPair;
	syncGroupActiveId?: boolean;
};

type BuildBoundsOptionsParams = {
	props: Omit<ScreenInterpolationProps, "bounds">;
	id?: BoundId;
	group?: string;
	overrides?: Partial<BoundsOptions>;
};

export const buildBoundsOptions = ({
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

const syncGroupActiveMember = (group?: string, id?: BoundId) => {
	"worklet";
	if (!group || id == null || id === "") return;

	const normalizedId = String(id);

	if (getGroupActiveId(group) === normalizedId) return;

	setGroupActiveId(group, normalizedId);
};

export const prepareBoundStyles = <T extends BoundsOptions>({
	props,
	options,
	resolvedPair,
}: ComputeResolvedBoundsStylesParams<T>): BoundsOptionsResult<T> => {
	"worklet";

	syncGroupActiveMember(options.group, options.id);

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
