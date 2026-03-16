import type { ScreenInterpolationProps } from "../../../types/animation.types";

export type BoundsFrameProps = Omit<ScreenInterpolationProps, "bounds"> & {
	navigationMaskEnabled: boolean;
};
