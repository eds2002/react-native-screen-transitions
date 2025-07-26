import { forwardRef } from "react";
import { TransitionNestingContext } from "@/contexts/transition-nesting";
import type { Any } from "@/types";
import { TransitionGestureHandlerProvider } from "../providers/transition-gesture-handler-provider";
import { FlickerPrevention } from "./flicker-prevention";
import { InterpolatorContentStyles } from "./interpolator-content-styles";
import { InterpolatorOverlayStyles } from "./interpolator-overlay-styles";

export const RootWrapper = forwardRef<
	Any,
	{
		children: React.ReactNode;
		screenKey: string;
		nestingMap: Record<string, number>;
	}
>(({ children, screenKey, nestingMap }, ref) => {
	const newNestingMap = {
		...nestingMap,
		[screenKey]: (nestingMap[screenKey] || 0) + 1,
	};

	// Check how many times the screen has been nested
	const nestingDepth = nestingMap[screenKey] || 0;
	const isNested = nestingDepth > 0;

	if (isNested) {
		return children;
	}

	return (
		<TransitionNestingContext.Provider value={newNestingMap}>
			<TransitionGestureHandlerProvider>
				<FlickerPrevention>
					<InterpolatorOverlayStyles />
					<InterpolatorContentStyles ref={ref}>
						{children}
					</InterpolatorContentStyles>
				</FlickerPrevention>
			</TransitionGestureHandlerProvider>
		</TransitionNestingContext.Provider>
	);
});
