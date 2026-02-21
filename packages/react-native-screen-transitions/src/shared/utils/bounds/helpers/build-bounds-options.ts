import { BoundStore } from "../../../stores/bounds.store";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsOptions } from "../types/options";
import { DEFAULT_BOUNDS_OPTIONS } from "./constants";
import type { ResolveBoundTagParams } from "./resolve-bound-tag";

type BuildBoundsOptionsParams = {
	props: Omit<ScreenInterpolationProps, "bounds">;
	id?: string;
	group?: string;
	overrides?: Partial<BoundsOptions>;
	mode?: "style" | "navigation";
	resolveBoundTag: (params: ResolveBoundTagParams) => string | undefined;
};

export const buildBoundsOptions = ({
	props,
	id,
	group,
	overrides,
	mode = "style",
	resolveBoundTag,
}: BuildBoundsOptionsParams): BoundsOptions => {
	"worklet";

	const tag = resolveBoundTag({ id, group });
	const currentScreenKey = props.current?.route.key;
	const boundaryConfig =
		tag && currentScreenKey
			? BoundStore.getBoundaryConfig(tag, currentScreenKey)
			: null;

	const resolved = {
		...DEFAULT_BOUNDS_OPTIONS,
		...(boundaryConfig ?? {}),
		...(overrides ?? {}),
		id: tag ?? "",
		group,
	};

	// Element-level bounds style composition always uses relative space.
	// Absolute space is reserved for internal navigation helpers (masking).
	if (mode === "style") {
		resolved.space = "relative";
	}

	return resolved;
};
