import type { ReactNode } from "react";
import { useMemo } from "react";
import { type ScaledSize, useWindowDimensions } from "react-native";
import {
	type EdgeInsets,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import createProvider from "../utils/create-provider";

export interface ViewportContextValue {
	dimensions: ScaledSize;
	insets: EdgeInsets;
}

interface ViewportProviderProps {
	children: ReactNode;
}

const { ViewportProvider, useViewportContext } = createProvider("Viewport", {
	guarded: true,
})<ViewportProviderProps, ViewportContextValue>(({ children }) => {
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const value = useMemo(
		() => ({
			dimensions,
			insets,
		}),
		[dimensions, insets],
	);

	return {
		value,
		children,
	};
});

export { ViewportProvider, useViewportContext };
