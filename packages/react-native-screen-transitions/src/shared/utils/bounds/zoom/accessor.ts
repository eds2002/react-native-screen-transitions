import type { BoundsNavigationZoomOptions } from "../../../types/bounds.types";
import type { ResolveBoundTagParams } from "../helpers/resolve-bound-tag";
import type { BoundsFrameProps } from "../types/frame-props";
import type { BoundId, BoundsOptions } from "../types/options";
import { buildZoomStyles } from "./build";

type ZoomAccessorParams = {
	id?: BoundId;
	group?: string;
	getProps: () => BoundsFrameProps;
	resolveBoundTag: (params: ResolveBoundTagParams) => string | undefined;
	computeRaw: (
		overrides?: Partial<BoundsOptions>,
		frameProps?: BoundsFrameProps,
	) => Record<string, unknown>;
	zoomBaseOptions?: Pick<
		BoundsNavigationZoomOptions,
		"anchor" | "scaleMode" | "target"
	>;
};

export const createZoomAccessor = ({
	id,
	group,
	getProps,
	resolveBoundTag,
	computeRaw,
	zoomBaseOptions,
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
			const mergedOptions =
				zoomBaseOptions || options
					? {
							...(zoomBaseOptions ?? {}),
							...(options ?? {}),
							...(options?.mask ? { mask: options.mask } : {}),
							...(options?.motion ? { motion: options.motion } : {}),
						}
					: undefined;
			return computeZoomStyles(mergedOptions);
		},
	};
};
