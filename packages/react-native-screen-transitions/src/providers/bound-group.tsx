import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

type BoundGroup = {
	broadcast: () => void;
	signal: SharedValue<number>;
};

const BoundGroupContext = createContext<BoundGroup | null>(null);

export const useBoundGroup = () => useContext(BoundGroupContext);

export const BoundGroupProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const signal = useSharedValue(0);

	const broadcast = useCallback(() => {
		"worklet";
		signal.value = signal.value + 1;
	}, [signal]);

	const value = useMemo(() => ({ signal, broadcast }), [signal, broadcast]);

	return (
		<BoundGroupContext.Provider value={value}>
			{children}
		</BoundGroupContext.Provider>
	);
};

export const useBoundGroupSignal = () => {
	const context = useBoundGroup();

	return context;
};
