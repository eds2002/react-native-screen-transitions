import type { SharedValue } from "react-native-reanimated";
import { isSharedValue, useDerivedValue } from "react-native-reanimated";
import type { Any } from "@/types";

type Animatable<V> = SharedValue<V> | V;

export default function useAnimatableValue<V>(
	value: Animatable<V>,
): SharedValue<V>;

export default function useAnimatableValue<V, F extends (value: V) => Any>(
	value: Animatable<V>,
	modify: F,
): SharedValue<ReturnType<F>>;

export default function useAnimatableValue<V, F extends (value: V) => Any>(
	value: Animatable<V>,
	modify?: F,
): SharedValue<ReturnType<F>> | SharedValue<V> {
	return useDerivedValue(() => {
		const inputValue = isSharedValue<V>(value) ? value.value : value;
		return modify ? modify(inputValue) : inputValue;
	}, [value, modify]);
}
