import type {
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
} from "../../../types/bounds.types";
import type { ResolveBoundTagParams } from "../helpers/resolve-bound-tag";
import type { BoundId, BoundsOptions } from "../types/options";
import { buildZoomStyles } from "./build";

type ZoomAccessorParams = {
	id?: BoundId;
	group?: string;
	getProps: () => BoundsInterpolationProps;
	resolveBoundTag: (params: ResolveBoundTagParams) => string | undefined;
	computeRaw: (
		overrides?: Partial<BoundsOptions>,
		frameProps?: BoundsInterpolationProps,
	) => Record<string, unknown>;
};

export const createZoomAccessor = ({
	id,
	group,
	getProps,
	resolveBoundTag,
	computeRaw,
}: ZoomAccessorParams) => {
	"worklet";

	const resolvedId = id ?? "";

	const computeZoomStyles = (zoomOptions?: BoundsNavigationZoomOptions) => {
		"worklet";
		const frameProps = getProps();
		return buildZoomStyles({
			id: resolvedId,
			group,
			zoomOptions,
			props: frameProps,
			resolveTag: resolveBoundTag,
			computeRaw: (overrides) =>
				computeRaw(
					{
						...(overrides ?? {}),
						raw: true,
					},
					frameProps,
				),
		});
	};

	return {
		zoom: (options?: BoundsNavigationZoomOptions) => {
			"worklet";
			return computeZoomStyles(options);
		},
	};
};
