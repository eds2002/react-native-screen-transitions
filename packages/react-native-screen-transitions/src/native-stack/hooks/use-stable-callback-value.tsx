/**
 * Credit:
 * https://github.com/MatiPl01/react-native-sortables/blob/main/packages/react-native-sortables/src/integrations/reanimated/hooks/useStableCallbackValue.ts
 */
import { useCallback, useEffect, useState } from "react";
import {
	isWorkletFunction,
	makeMutable,
	runOnJS,
} from "react-native-reanimated";

// biome-ignore lint/suspicious/noExplicitAny: <Does not matter>
type AnyFunction = (...args: Array<any>) => any;

function useMutableValue<T>(initialValue: T) {
	return useState(() => makeMutable(initialValue))[0];
}

// We cannot store a function as a SharedValue because reanimated will treat
// it as an animation and will try to execute the animation when assigned
// to the SharedValue. Since we want the function to be treated as a value,
// we wrap it in an object and store the object in the SharedValue.
type WrappedCallback<C extends AnyFunction> = {
	call: C;
};

const wrap = <C extends AnyFunction>(callback: C): WrappedCallback<C> => {
	if (isWorkletFunction(callback)) {
		return { call: callback };
	}
	return {
		call: ((...args: Parameters<C>) => {
			"worklet";
			runOnJS(callback)(...args);
		}) as C,
	};
};

/** Creates a stable worklet callback that can be called from the UI runtime
 * @param callback The JavaScript or worklet function to be called
 * @returns A worklet function that can be safely called from the UI thread
 * @default Behavior:
 * - If passed a regular JS function, calls it on the JS thread using runOnJS
 * - If passed a worklet function, calls it directly on the UI thread
 * @important The returned function maintains a stable reference and properly handles
 * thread execution based on the input callback type
 */
export default function useStableCallbackValue<C extends AnyFunction>(
	callback?: C,
) {
	const stableCallback = useMutableValue<null | WrappedCallback<C>>(null);

	useEffect(() => {
		if (callback) {
			stableCallback.value = wrap(callback);
		} else {
			stableCallback.value = null;
		}
	}, [callback, stableCallback]);

	return useCallback(
		(...args: Parameters<C>) => {
			"worklet";
			stableCallback.value?.call(...args);
		},
		[stableCallback],
	);
}
