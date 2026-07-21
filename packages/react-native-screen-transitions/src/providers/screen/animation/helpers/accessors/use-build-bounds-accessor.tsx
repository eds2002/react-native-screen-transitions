import { useMemo } from "react";
import { createBoundsAccessor } from "../../../../../utils/bounds";
import { useScreenAnimationContext } from "../../animation.provider";

export const useBuildBoundsAccessor = () => {
	const { screenInterpolatorProps } = useScreenAnimationContext();
	return useMemo(() => {
		return createBoundsAccessor(() => {
			"worklet";
			return screenInterpolatorProps.get();
		});
	}, [screenInterpolatorProps]);
};
