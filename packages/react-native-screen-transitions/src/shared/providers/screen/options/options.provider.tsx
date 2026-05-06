import { useLayoutEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { useDescriptors } from "../descriptors";
import { resolveBaseScreenOptions, syncScreenOptionsBase } from "./helpers";
import type {
	ScreenOptionsContextValue,
	ScreenOptionsProviderProps,
	ScreenOptionsState,
} from "./types";

export const { ScreenOptionsProvider, useScreenOptionsContext } =
	createProvider("ScreenOptions")<
		ScreenOptionsProviderProps,
		ScreenOptionsContextValue
	>(() => {
		const {
			current: { options },
		} = useDescriptors();

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
