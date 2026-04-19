import type {
	SharedValue,
	WithSpringConfig,
	WithTimingConfig,
} from "react-native-reanimated";
import { animate } from "./animate";

export type AnimateManyItem = {
	value: SharedValue<number>;
	toValue: number;
	config?: WithSpringConfig | WithTimingConfig;
};

interface AnimateManyProps {
	items: AnimateManyItem[];
	onAllFinished?: () => void;
}

export const animateMany = ({ items, onAllFinished }: AnimateManyProps) => {
	"worklet";

	if (items.length === 0) {
		onAllFinished?.();
		return;
	}

	let remaining = items.length;

	for (const item of items) {
		item.value.value = animate(item.toValue, item.config, (finished) => {
			"worklet";
			if (!finished) return;

			remaining -= 1;
			if (remaining === 0) {
				onAllFinished?.();
			}
		});
	}
};
