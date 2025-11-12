import { createContext, useContext, useMemo } from "react";
import type { NativeStackDescriptor } from "../../native-stack/types";

interface KeysContextType {
	previous?: NativeStackDescriptor;
	current: NativeStackDescriptor;
	next?: NativeStackDescriptor;
}

const KeysContext = createContext<KeysContextType | undefined>(undefined);

interface KeysProviderProps {
	children: React.ReactNode;
	previous?: NativeStackDescriptor;
	current: NativeStackDescriptor;
	next?: NativeStackDescriptor;
}

export const KeysProvider = ({
	children,
	previous,
	current,
	next,
}: KeysProviderProps) => {
	const value = useMemo(
		() => ({ previous, current, next }),
		[previous, current, next],
	);
	return <KeysContext.Provider value={value}>{children}</KeysContext.Provider>;
};

export const useKeys = (): KeysContextType => {
	const context = useContext(KeysContext);
	if (context === undefined) {
		throw new Error("useKeys must be used within a KeysProvider");
	}
	return context;
};
