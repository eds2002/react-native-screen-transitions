import type { MeasuredDimensions } from "react-native-reanimated";
import { Bounds } from "../../../stores/bounds";

export const isBoundsEqual = ({
	measured,
	key,
	sharedBoundTag,
}: {
	measured: MeasuredDimensions;
	key: string;
	sharedBoundTag: string;
}) => {
	"worklet";
	const existing = Bounds.getBounds(key)?.[sharedBoundTag]?.bounds;
	return (
		existing &&
		existing.width === measured.width &&
		existing.height === measured.height &&
		existing.pageX === measured.pageX &&
		existing.pageY === measured.pageY &&
		existing.x === measured.x &&
		existing.y === measured.y
	);
};
