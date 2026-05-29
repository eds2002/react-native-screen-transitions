import { useLayoutEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { useDescriptorsStore } from "../descriptors";
import { resolveBaseScreenOptions, syncScreenOptionsBase } from "./helpers";
import type {
	ScreenOptionsContextValue,
	ScreenOptionsProviderProps,
	ScreenOptionsState,
} from "./types";

export const {
	ScreenOptionsProvider,
	useScreenOptionsContext,
	useScreenOptionsStore,
} = createProvider("ScreenOptions")<
	ScreenOptionsProviderProps,
	ScreenOptionsContextValue
>(() => {
	const options = useDescriptorsStore(
		(store) => store.descriptors.current.options,
	);

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

	return {
		value,
	};
});
