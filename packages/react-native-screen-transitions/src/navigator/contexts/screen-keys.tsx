import { createContext, useContext } from "react";

export const ScreenKeysContext = createContext<{
	currentScreenKey: string;
	previousScreenKey?: string;
	nextScreenKey?: string;
} | null>(null);

export const useScreenKeys = () => {
	const context = useContext(ScreenKeysContext);

	if (!context) {
		throw new Error("ScreenKeysContext not found");
	}

	return context;
};
