import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
} from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import {
	isTeleportAvailable,
	NativePortal,
	PORTAL_POINTER_EVENTS,
} from "../../teleport";
import { useBoundaryContentPortalAttachment } from "./hooks/use-boundary-content-portal-attachment";

export { BoundaryContentPortalHost } from "./components/host";

type BoundaryContentPortalProps = {
	boundaryId?: string;
	children: ReactNode;
	enabled: boolean;
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
const EnabledNativePortal = AnimatedNativePortal as NonNullable<
	typeof AnimatedNativePortal
>;

export const BoundaryContentPortal = memo(function BoundaryContentPortal({
	boundaryId,
	children,
	enabled,
}: BoundaryContentPortalProps) {
	if (
		!enabled ||
		boundaryId === undefined ||
		!isTeleportAvailable ||
		!AnimatedNativePortal
	) {
		return children;
	}

	return (
		<EnabledBoundaryContentPortal boundaryId={boundaryId}>
			{children}
		</EnabledBoundaryContentPortal>
	);
});

const EnabledBoundaryContentPortal = memo(
	function EnabledBoundaryContentPortal({
		boundaryId,
		children,
	}: Omit<BoundaryContentPortalProps, "enabled"> & { boundaryId: string }) {
		const { teleportProps } = useBoundaryContentPortalAttachment({
			boundaryId,
		});

		return (
			<EnabledNativePortal
				animatedProps={teleportProps}
				name={boundaryId}
				pointerEvents={PORTAL_POINTER_EVENTS}
				style={StyleSheet.absoluteFill}
			>
				{children}
			</EnabledNativePortal>
		);
	},
);
