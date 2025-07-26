import { createContext } from "react";

export const TransitionNestingContext = createContext<Record<string, number>>(
	{},
);
