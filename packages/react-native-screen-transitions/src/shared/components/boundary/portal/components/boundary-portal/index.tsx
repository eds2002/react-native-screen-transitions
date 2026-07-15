import { memo, type ReactNode } from "react";
import type { View, ViewProps } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { BoundaryPortalSlot } from "./components/portal-slot";
import { useBoundaryPortalAttachment } from "./hooks/use-boundary-portal-attachment";

type BoundaryPortalProps = {
	boundaryId: string;
	children: ReactNode;
	enabled: boolean;
	placeholderRef?: AnimatedRef<View>;
	pointerEvents?: ViewProps["pointerEvents"];
};

export const BoundaryPortal = memo(function BoundaryPortal({
	boundaryId,
	children,
	enabled,
	placeholderRef,
	pointerEvents,
}: BoundaryPortalProps) {
	const { teleportProps } = useBoundaryPortalAttachment({
		boundaryId,
		enabled,
	});

	return (
		<BoundaryPortalSlot
			id={boundaryId}
			enabled={enabled}
			animatedProps={teleportProps}
			placeholderRef={placeholderRef}
			pointerEvents={pointerEvents}
		>
			{children}
		</BoundaryPortalSlot>
	);
});
