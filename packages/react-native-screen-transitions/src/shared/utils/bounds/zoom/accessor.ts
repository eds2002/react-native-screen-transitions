import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsNavigationZoomOptions } from "../../../types/bounds.types";
import type { ResolveBoundTagParams } from "../helpers/resolve-bound-tag";
import type { BoundsOptions } from "../types/options";
import { buildZoomStyles } from "./build";

type ZoomAccessorParams = {
	id?: string;
	group?: string;
	getProps: () => Omit<ScreenInterpolationProps, "bounds">;
	resolveBoundTag: (params: ResolveBoundTagParams) => string | undefined;
	computeRaw: (
		overrides?: Partial<BoundsOptions>,
		frameProps?: Omit<ScreenInterpolationProps, "bounds">,
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
