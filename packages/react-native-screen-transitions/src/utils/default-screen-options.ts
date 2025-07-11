/**
 * Helper function to return the default screen options in order for the screen animations to work properly.
 */
export const defaultScreenOptions = () =>
	({
		presentation: "containedTransparentModal",
		headerShown: false,
		animation: "none",
	}) as const;
