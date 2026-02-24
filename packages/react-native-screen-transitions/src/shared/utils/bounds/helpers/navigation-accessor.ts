import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsNavigationOptions } from "../../../types/bounds.types";
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
	zoomBaseOptions?: Pick<BoundsOptions, "anchor" | "scaleMode" | "target">;
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
		preset: "hero" | "zoom",
		navigationOptions?: BoundsNavigationOptions,
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
		hero: (options?: BoundsNavigationOptions) => {
			"worklet";
			return computeNavigationPresetStyles("hero", options);
		},
		zoom: () => {
			"worklet";
			return computeNavigationPresetStyles("zoom", zoomBaseOptions);
		},
	};
};
