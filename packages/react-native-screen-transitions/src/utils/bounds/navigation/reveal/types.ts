import type {
	BoundsInterpolationProps,
	BoundsNavigationRevealOptions,
	BoundsNavigationRevealStyle,
} from "../../../../types/bounds.types";

export type RevealInterpolatedStyle = BoundsNavigationRevealStyle;

export type BuildRevealStylesParams = {
	tag?: string;
	props: BoundsInterpolationProps;
	revealOptions?: BoundsNavigationRevealOptions;
};
