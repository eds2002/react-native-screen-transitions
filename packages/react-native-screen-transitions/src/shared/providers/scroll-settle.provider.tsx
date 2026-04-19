import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";
import createProvider from "../utils/create-provider";

interface ScrollSettleProviderProps {
	settledSignal: SharedValue<number>;
	children: ReactNode;
}

interface ScrollSettleContextValue {
	settledSignal: SharedValue<number>;
}

const { ScrollSettleProvider, useScrollSettleContext } = createProvider(
	"ScrollSettle",
	{ guarded: false },
)<ScrollSettleProviderProps, ScrollSettleContextValue>(
	({ settledSignal, children }) => ({
		value: { settledSignal },
		children,
	}),
);

export { ScrollSettleProvider, useScrollSettleContext };
