import { useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/**
 * The placeholder keeps the boundary's slot while its frame is in the overlay. Its size is the
 * boundary's own layout (not a measurement, which a scaled screen would shrink), kept on the JS side
 * without a UI-thread hop, and pinned only once the boundary is measured for a transition: that
 * render lands before its overlay host exists, so before the frame can leave. Boundaries that never
 * transition pay one cheap layout callback.
 */
export const usePlaceholderStyles = (pinned: boolean) => {
	const layout = useRef<{ width: number; height: number } | null>(null);
	const [pinnedSize, setPinnedSize] = useState<{
		width: number;
		height: number;
	} | null>(null);

	if (pinned && !pinnedSize && layout.current) {
		setPinnedSize(layout.current);
	}

	const handleOnLayout = ({ nativeEvent }: LayoutChangeEvent) => {
		const { width, height } = nativeEvent.layout;
		if (width === 0 || height === 0) return;
		layout.current = { width, height };
		if (pinned && !pinnedSize) setPinnedSize(layout.current);
	};

	return { placeholderStyle: pinnedSize ?? undefined, handleOnLayout };
};
