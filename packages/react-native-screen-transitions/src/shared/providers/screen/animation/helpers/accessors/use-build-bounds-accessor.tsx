import { useMemo } from "react";
import { createBoundsAccessor } from "../../../../../utils/bounds";
import { useScreenAnimationStore } from "../../animation.provider";

export const useBuildBoundsAccessor = () => {
	const screenInterpolatorProps = useScreenAnimationStore(
		(store) => store.screenInterpolatorProps,
	);
	return useMemo(() => {
		return createBoundsAccessor(() => {
			"worklet";
			return screenInterpolatorProps.get();
		});
	}, [screenInterpolatorProps]);
};
