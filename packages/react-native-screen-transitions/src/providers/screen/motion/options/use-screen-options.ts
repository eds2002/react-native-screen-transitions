import { useLayoutEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import { useBuilderStore } from "../../builder";
import { resolveBaseScreenOptions, syncScreenOptionsBase } from "./helpers";
import type { ScreenOptionsContextValue, ScreenOptionsState } from "./types";

export function useScreenOptions(): ScreenOptionsContextValue {
	const options = useBuilderStore((store) => store.options);

	const baseScreenOptions = useMemo(
		() => resolveBaseScreenOptions(options),
		[options],
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
