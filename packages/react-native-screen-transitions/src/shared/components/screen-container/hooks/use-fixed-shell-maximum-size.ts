import { useCallback, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { TransitionClipMaximumSize } from "../../clip-view";

export const createPositiveMaximumSizeFallback = (
	width: number,
	height: number,
): TransitionClipMaximumSize => ({
	height: Number.isFinite(height) && height > 0 ? height : 1,
	width: Number.isFinite(width) && width > 0 ? width : 1,
});

/**
 * Retains the last positive Yoga measurement. Transient zero-sized layouts
 * during orientation and native-stack attachment must not collapse a live
 * SmoothClip host or replace its driver.
 */
export const updateDurableMaximumSize = (
	previous: TransitionClipMaximumSize | null,
	width: unknown,
	height: unknown,
): TransitionClipMaximumSize | null => {
	if (
		typeof width !== "number" ||
		typeof height !== "number" ||
		!Number.isFinite(width) ||
		!Number.isFinite(height) ||
		width <= 0 ||
		height <= 0
	) {
		return previous;
	}

	if (previous?.width === width && previous.height === height) {
		return previous;
	}

	return { height, width };
};

export const useFixedShellMaximumSize = (
	fallback: TransitionClipMaximumSize,
	onMaximumSizeChange?: (maximumSize: TransitionClipMaximumSize) => void,
) => {
	const [measured, setMeasured] = useState<TransitionClipMaximumSize | null>(
		null,
	);
	const measuredRef = useRef<TransitionClipMaximumSize | null>(null);
	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { height, width } = event.nativeEvent.layout;
			const next = updateDurableMaximumSize(measuredRef.current, width, height);
			if (next === measuredRef.current || next === null) return;

			measuredRef.current = next;
			setMeasured(next);
			onMaximumSizeChange?.(next);
		},
		[onMaximumSizeChange],
	);
	const maximumSize = useMemo(() => measured ?? fallback, [fallback, measured]);

	return { maximumSize, onLayout } as const;
};
