import { useLayoutEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import { useBuilderStore } from "../../builder";
import {
	resolveBaseScreenOptions,
	screenOptionInputs,
	syncScreenOptionsBase,
} from "./helpers";
import type { ScreenOptionsContextValue, ScreenOptionsState } from "./types";

export function useScreenOptions(): ScreenOptionsContextValue {
	const options = useBuilderStore((store) => store.options);

	// Recomputed only when an option the table reads changes: a new base re-sets the shared value.
	const baseScreenOptions = useMemo(
		() => resolveBaseScreenOptions(options),
		// biome-ignore lint/correctness/useExhaustiveDependencies: the inputs are the table's options.
		screenOptionInputs(options),
	);

	const initialScreenOptions = useMemo<ScreenOptionsState>(
		() => ({
			...baseScreenOptions,
			baseOptions: baseScreenOptions,
		}),
		[baseScreenOptions],
	);

	const value = useSharedValue(initialScreenOptions);

	useLayoutEffect(() => {
		syncScreenOptionsBase(value, baseScreenOptions);
	}, [value, baseScreenOptions]);

	return value;
}
