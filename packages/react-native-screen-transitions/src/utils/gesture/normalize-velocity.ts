export const normalizeVelocity = (vPxPerSec: number, size: number) => {
	"worklet";
	const v = vPxPerSec / Math.max(1, size);
	const CAP = 1.6;
	return Math.max(-CAP, Math.min(v, CAP));
};
