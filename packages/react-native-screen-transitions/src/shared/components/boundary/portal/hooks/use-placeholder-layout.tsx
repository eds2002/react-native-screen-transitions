import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

export const usePlaceholderLayout = () => {
	const [layout, setLayout] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});

	const handleLayout = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setLayout((prev) =>
			prev.width === width && prev.height === height ? prev : { width, height },
		);
	}, []);

	const placeholderStyle = useMemo(
		() => ({
			width: layout.width,
			height: layout.height,
		}),
		[layout],
	);

	return {
		placeholderStyle,
		handleLayout,
	};
};
