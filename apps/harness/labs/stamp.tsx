// @ts-nocheck
/**
 * Visual-check aids for recorded e2e runs (see e2e/visual/README.md).
 *
 * BLANK: the color behind every screen. No screen uses it, so any of it on a
 * recorded frame is a blank spot (unless the scenario allows some).
 *
 * FrameStamp: two rows of STAMP_BITS cells in the bottom-left corner, black (0)
 * or white (1), least significant bit on the left, updated on the UI thread
 * every frame:
 *   row 1: frame callbacks run (they also run on touch events, so not a frame count; for debugging)
 *   row 2: time since start in 1/120 s units: orders recorded frames and says how many display frames apart they are
 * The analyzer reads them to drop repeated captures and normalize motion per display frame.
 */
import { View } from "react-native";
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from "react-native-reanimated";

export const BLANK = "#ff00ff";

export const STAMP = { left: 24, bottom: 6, cell: 12, bits: 10, unitMs: 1000 / 120 };

function Bit({ value, bit }) {
	const style = useAnimatedStyle(() => ({ backgroundColor: (value.value >> bit) & 1 ? "#ffffff" : "#000000" }));
	return <Animated.View style={[{ width: STAMP.cell, height: STAMP.cell }, style]} />;
}

function Row({ value }) {
	return (
		<View style={{ flexDirection: "row" }}>
			{Array.from({ length: STAMP.bits }, (_, bit) => (
				<Bit key={bit} value={value} bit={bit} />
			))}
		</View>
	);
}

export function FrameStamp() {
	const count = useSharedValue(0);
	const time = useSharedValue(0);
	const start = useSharedValue(-1);
	useFrameCallback((frame) => {
		"worklet";
		if (start.value < 0) start.value = frame.timestamp;
		const mod = 1 << STAMP.bits;
		count.value = (count.value + 1) % mod;
		time.value = Math.round((frame.timestamp - start.value) / STAMP.unitMs) % mod;
	});
	return (
		<View pointerEvents="none" style={{ position: "absolute", left: STAMP.left, bottom: STAMP.bottom, zIndex: 100000 }}>
			<Row value={count} />
			<Row value={time} />
		</View>
	);
}
