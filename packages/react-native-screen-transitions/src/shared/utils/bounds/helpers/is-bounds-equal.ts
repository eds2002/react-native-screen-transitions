import type { MeasuredDimensions } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds.store";

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
	const existing = BoundStore.getSnapshot(sharedBoundTag, key)?.bounds;
	return (
		!!existing &&
		existing.width === measured.width &&
		existing.height === measured.height &&
		existing.pageX === measured.pageX &&
		existing.pageY === measured.pageY &&
		existing.x === measured.x &&
		existing.y === measured.y
	);
};
