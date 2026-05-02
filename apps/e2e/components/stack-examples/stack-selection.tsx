import { createContext, useContext } from "react";
import type { StackType } from "./stack-routing";

type StackSelection = {
	stackType: StackType;
	setStackType: (stackType: StackType) => void;
};

export const StackSelectionContext = createContext<StackSelection | null>(null);

export function useStackSelection(): StackSelection {
	const selection = useContext(StackSelectionContext);
	if (!selection) {
		throw new Error("useStackSelection must be used within RootLayout");
	}
	return selection;
}
