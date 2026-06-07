import { memo, type ReactNode, useCallback, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { Portal as NativePortal } from "react-native-teleport";
import { createTransitionAwareComponent } from "../../../create-transition-aware-component";
import { createPortalName } from "../utils";

const TransitionAwareTeleport = createTransitionAwareComponent(NativePortal);

interface PortalProps {
	id?: string;
	children: ReactNode;
	enabled?: boolean;
}

export const Portal = memo(function Portal({
	id = "my-id",
	children,
	enabled = false,
}: PortalProps) {
	const styleId = createPortalName(id);

	const [layout, setLayout] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});

	const placeholderStyle =
		layout.width > 0 && layout.height > 0
			? { width: layout.width, height: layout.height, backgroundColor: "red" }
			: undefined;

	const handleLayout = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setLayout((prev) =>
			prev.width === width && prev.height === height ? prev : { width, height },
		);
	}, []);

	if (enabled) {
		return (
			<View onLayout={handleLayout} style={placeholderStyle}>
				<TransitionAwareTeleport styleId={styleId}>
					{children}
				</TransitionAwareTeleport>
			</View>
		);
	}

	return children;
});
