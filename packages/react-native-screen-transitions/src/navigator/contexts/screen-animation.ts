import { createContext, useContext } from "react";
import type { BaseScreenInterpolationProps } from "@/types";

export interface ScreenAnimationContextType
	extends BaseScreenInterpolationProps {}

export const ScreenAnimationContext = createContext<
	ScreenAnimationContextType | undefined
>(undefined);

export const useScreenAnimation = (): ScreenAnimationContextType => {
	const context = useContext(ScreenAnimationContext);

	if (!context) {
		throw new Error("ScreenAnimationContext not found");
	}

	return context;
};
