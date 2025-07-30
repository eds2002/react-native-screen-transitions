import { createContext, useContext } from "react";
import type { _BaseScreenInterpolationProps } from "@/types/animation";

// Context for screen animation values
export const ScreenAnimationContext =
	createContext<_BaseScreenInterpolationProps | null>(null);

/**
 * Hook to access screen animation context
 * @throws Error if used outside of ScreenAnimationProvider
 */
export const useScreenAnimationContext = (): _BaseScreenInterpolationProps => {
	const context = useContext(ScreenAnimationContext);
	if (!context) {
		throw new Error(
			"useScreenAnimationContext must be used within a ScreenAnimationProvider",
		);
	}
	return context;
};
