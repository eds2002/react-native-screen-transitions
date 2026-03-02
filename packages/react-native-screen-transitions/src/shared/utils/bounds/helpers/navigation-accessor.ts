import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsNavigationZoomOptions } from "../../../types/bounds.types";
import { buildNavigationStyles } from "../sugar/navigation";
import type { BoundsOptions } from "../types/options";
import type { ResolveBoundTagParams } from "./resolve-bound-tag";

type NavigationAccessorParams = {
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

export const createNavigationAccessor = ({
	id,
	group,
	getProps,
	resolveBoundTag,
	computeRaw,
	zoomBaseOptions,
}: NavigationAccessorParams) => {
	"worklet";

	const resolvedId = id ?? "";

	const computeNavigationPresetStyles = (
		preset: "zoom",
		navigationOptions?: BoundsNavigationZoomOptions,
	) => {
		"worklet";
		const frameProps = getProps();
		return buildNavigationStyles({
			id: resolvedId,
			group,
			preset,
			navigationOptions,
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
			return computeNavigationPresetStyles("zoom", mergedOptions);
		},
	};
};
