import type { ScaledSize } from "react-native";
import type { ScreenPhase } from "../../types/core";
import type { ScreenTransitionState } from "../../types/animation";
import { buildBoundStyles } from "./build-bound-styles";
import { getBounds } from "./get-bounds";

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

	return Object.assign(bounds, {
		get: (id?: string, phase?: ScreenPhase) =>
			getBounds({
				id: id ?? activeBoundId,
				phase,
				current,
				previous,
				next,
			}),
	});
};
