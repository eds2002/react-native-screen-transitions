import { type ReactNode, useCallback, useState } from "react";
import {
	type LayoutChangeEvent,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import createProvider from "../utils/create-provider";

interface LayoutDimensions {
	width: number;
	height: number;
}

interface LayoutDimensionsContextValue {
	layout: LayoutDimensions;
	layoutShared: SharedValue<LayoutDimensions>;
}

/**
 * Provider that measures its container and provides dimensions via context.
 * Use this to override window dimensions for animations in non-fullscreen containers.
 */
const { LayoutDimensionsProvider, useLayoutDimensionsContext } = createProvider(
	"LayoutDimensions",
	{ guarded: false },
)<{ children: ReactNode }, LayoutDimensionsContextValue>(({ children }) => {
	const windowDimensions = useWindowDimensions();

	const [layout, setLayout] = useState<LayoutDimensions>(windowDimensions);
	const layoutShared = useSharedValue<LayoutDimensions>(windowDimensions);

	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			setLayout({ width, height });
			layoutShared.value = { width, height };
		},
		[layoutShared],
	);

	return {
		value: { layout, layoutShared },
		children: (
			<View style={styles.container} onLayout={onLayout}>
				{children}
			</View>
		),
	};
});

export { LayoutDimensionsProvider, useLayoutDimensionsContext };

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
