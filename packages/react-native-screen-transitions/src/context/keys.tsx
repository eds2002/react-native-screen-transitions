import { createContext, useContext } from "react";
import type { NativeStackDescriptor } from "../types/navigator";

interface KeysContextType {
	previous?: NativeStackDescriptor;
	current: NativeStackDescriptor;
	next?: NativeStackDescriptor;
}

export const KeysContext = createContext<KeysContextType | undefined>(
	undefined,
);

export const useKeys = (): KeysContextType => {
	const context = useContext(KeysContext);
	if (context === undefined) {
		throw new Error("useKeys must be used within a KeysProvider");
	}
	return context;
};
