import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import createProvider from "../../utils/create-provider";

export type ScreenHostActivityMode = "visible" | "hidden";

interface ScreenHostProviderProps {
	activityMode: ScreenHostActivityMode;
	isInert: boolean;
	contentStyle?: StyleProp<ViewStyle>;
	children: ReactNode;
}

export interface ScreenHostContextValue {
	activityMode: ScreenHostActivityMode;
	isInert: boolean;
	contentStyle?: StyleProp<ViewStyle>;
}

export const { ScreenHostProvider, useScreenHostContext } = createProvider(
	"ScreenHost",
	{ guarded: true },
)<ScreenHostProviderProps, ScreenHostContextValue>(
	({ activityMode, isInert, contentStyle, children }) => ({
		value: {
			activityMode,
			isInert,
			contentStyle,
		},
		children,
	}),
);
