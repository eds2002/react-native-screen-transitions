export const getVisibilityBlockOffset = (viewportHeight: number): number => {
	"worklet";
	return viewportHeight * 2 + 1;
};
