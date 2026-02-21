import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsNavigationOptions } from "../../../types/bounds.types";
import { buildNavigationStyles } from "../sugar/navigation";
import type { BoundsOptions } from "../types/options";
import type { ResolveBoundTagParams } from "./resolve-bound-tag";

type NavigationAccessorParams = {
	id?: string;
	group?: string;
	props: Omit<ScreenInterpolationProps, "bounds">;
	resolveBoundTag: (params: ResolveBoundTagParams) => string | undefined;
	computeRaw: (overrides?: Partial<BoundsOptions>) => Record<string, unknown>;
};

export const createNavigationAccessor = ({
	id,
	group,
	props,
	resolveBoundTag,
	computeRaw,
}: NavigationAccessorParams) => {
	"worklet";

	const resolvedId = id ?? "";

	const computeNavigationPresetStyles = (
		preset: "hero" | "zoom",
		navigationOptions?: BoundsNavigationOptions,
	) => {
		"worklet";
		return buildNavigationStyles({
			id: resolvedId,
			group,
			preset,
			navigationOptions,
			props,
			resolveTag: resolveBoundTag,
			computeRaw: (overrides) =>
				computeRaw({
					...(overrides ?? {}),
					raw: true,
				}),
		});
	};

	return {
		hero: (options?: BoundsNavigationOptions) => {
			"worklet";
			return computeNavigationPresetStyles("hero", options);
		},
		zoom: (options?: BoundsNavigationOptions) => {
			"worklet";
			return computeNavigationPresetStyles("zoom", options);
		},
	};
};
