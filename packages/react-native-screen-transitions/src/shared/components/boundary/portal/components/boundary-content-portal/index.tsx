import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
} from "react";
import type { ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { isTeleportAvailable, NativePortal } from "../../teleport";
import { useBoundaryContentPortalAttachment } from "./hooks/use-boundary-content-portal-attachment";

export { BoundaryContentPortalHost } from "./components/host";

type BoundaryContentPortalProps = {
	boundaryId?: string;
	children: ReactNode;
	enabled: boolean;
	pointerEvents?: ViewProps["pointerEvents"];
};

type NullableHostNamePortalProps = Omit<
	ComponentProps<NonNullable<typeof NativePortal>>,
	"hostName"
> & {
	hostName?: string | null;
};

const AnimatedNativePortal = NativePortal
	? Animated.createAnimatedComponent(
			NativePortal as ComponentType<NullableHostNamePortalProps>,
		)
	: null;

export const BoundaryContentPortal = memo(function BoundaryContentPortal({
	boundaryId,
	children,
	enabled,
	pointerEvents,
}: BoundaryContentPortalProps) {
	const shouldEnablePortal = enabled && boundaryId !== undefined;
	const { teleportProps } = useBoundaryContentPortalAttachment({
		boundaryId: boundaryId ?? "",
		enabled: shouldEnablePortal,
	});

	if (shouldEnablePortal && isTeleportAvailable && AnimatedNativePortal) {
		return (
			<AnimatedNativePortal
				animatedProps={teleportProps}
				name={boundaryId}
				pointerEvents={pointerEvents}
			>
				{children}
			</AnimatedNativePortal>
		);
	}

	return children;
});
