import type { ScaledSize } from "react-native";
import type { ScreenTransitionState } from "../../types/animation";
import { buildBoundStyles } from "./build-bound-styles";

export interface BuildBoundsAccessorParams {
	activeBoundId: string | null;
	current: ScreenTransitionState;
	previous?: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: ScaledSize;
}

export const buildBoundsAccessor = ({
	activeBoundId,
	current,
	previous,
	next,
	progress,
	dimensions,
}: BuildBoundsAccessorParams) => {
	"worklet";
	const bounds = (id?: string) =>
		buildBoundStyles({
			id: id ?? activeBoundId,
			previous,
			current,
			next,
			progress,
			dimensions,
		});

	return bounds;
};
