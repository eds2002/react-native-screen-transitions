export function interpolateClamped(
	value: number,
	inputRange: readonly [number, number],
	outputRange: readonly [number, number],
): number {
	"worklet";
	const [inputStart, inputEnd] = inputRange;
	const [outputStart, outputEnd] = outputRange;

	const inputSpan = inputEnd - inputStart;
	if (inputSpan === 0) {
		return outputStart;
	}

	const normalized = (value - inputStart) / inputSpan;
	const clamped = normalized < 0 ? 0 : normalized > 1 ? 1 : normalized;

	return outputStart + (outputEnd - outputStart) * clamped;
}
