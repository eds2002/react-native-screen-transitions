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

export type FixedShellMeasurement = Readonly<{
	epoch: string;
	maximumSize: TransitionClipMaximumSize;
}>;

export const selectFixedShellMaximumSize = (
	measurement: FixedShellMeasurement | null,
	currentEpoch: string,
	fallback: TransitionClipMaximumSize,
): TransitionClipMaximumSize =>
	measurement?.epoch === currentEpoch ? measurement.maximumSize : fallback;

export const useFixedShellMaximumSize = (
	fallback: TransitionClipMaximumSize,
	layoutEpoch: string,
	onMaximumSizeChange?: (maximumSize: TransitionClipMaximumSize) => void,
) => {
	const [measurement, setMeasurement] = useState<FixedShellMeasurement | null>(
		null,
	);
	const measurementRef = useRef<FixedShellMeasurement | null>(null);
	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { height, width } = event.nativeEvent.layout;
			const previous =
				measurementRef.current?.epoch === layoutEpoch
					? measurementRef.current.maximumSize
					: null;
			const next = updateDurableMaximumSize(previous, width, height);
			if (next === previous || next === null) return;

			const nextMeasurement = { epoch: layoutEpoch, maximumSize: next };
			measurementRef.current = nextMeasurement;
			setMeasurement(nextMeasurement);
			onMaximumSizeChange?.(next);
		},
		[layoutEpoch, onMaximumSizeChange],
	);
	const maximumSize = useMemo(
		() => selectFixedShellMaximumSize(measurement, layoutEpoch, fallback),
		[fallback, layoutEpoch, measurement],
	);

	return { maximumSize, onLayout } as const;
};
