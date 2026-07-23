import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
} from "react";
import type { View } from "react-native";
import Animated, { type AnimatedRef, runOnUI } from "react-native-reanimated";
import { logger } from "../../../../../utils/logger";
import {
	isTeleportAvailable,
	PORTAL_POINTER_EVENTS,
	NativePortal as TeleportPortal,
} from "../../teleport";
import { useBoundaryPortalAttachment } from "./hooks/use-boundary-portal-attachment";
import { usePlaceholderStyles } from "./hooks/use-placeholder-styles";

type NullableHostNamePortalProps = Omit<
	ComponentProps<NonNullable<typeof TeleportPortal>>,
	"hostName"
> & {
	hostName?: string | null;
};

const AnimatedNativePortal = TeleportPortal
	? Animated.createAnimatedComponent(
			TeleportPortal as ComponentType<NullableHostNamePortalProps>,
		)
	: null;
const EnabledNativePortal = AnimatedNativePortal as NonNullable<
	typeof AnimatedNativePortal
>;

type BoundaryPortalProps = {
	boundaryId: string;
	children: ReactNode;
	enabled: boolean;
	placeholderRef?: AnimatedRef<View>;
};

export const BoundaryPortal = memo(function BoundaryPortal({
	boundaryId,
	children,
	enabled,
	placeholderRef,
}: BoundaryPortalProps) {
	if (!enabled || !isTeleportAvailable || !AnimatedNativePortal) {
		return children;
	}

	return (
		<EnabledBoundaryPortal
			boundaryId={boundaryId}
			placeholderRef={placeholderRef}
		>
			{children}
		</EnabledBoundaryPortal>
	);
});

const EnabledBoundaryPortal = memo(function EnabledBoundaryPortal({
	boundaryId,
	children,
	placeholderRef,
}: Omit<BoundaryPortalProps, "enabled">) {
	if (__DEV__ && !boundaryId) {
		logger.warnOnce(
			"portal:missing-id",
			"A boundary portal was rendered without an id; rendering inline.",
		);
	}

	const { teleportProps } = useBoundaryPortalAttachment({ boundaryId });
	const { handleOnLayout, placeholderStyle } = usePlaceholderStyles();

	return (
		<Animated.View
			ref={placeholderRef}
			onLayout={({ nativeEvent: { layout } }) =>
				runOnUI(handleOnLayout)(layout)
			}
			style={placeholderStyle}
			pointerEvents={PORTAL_POINTER_EVENTS}
			collapsable={false}
		>
			<EnabledNativePortal
				animatedProps={teleportProps}
				name={boundaryId}
				pointerEvents={PORTAL_POINTER_EVENTS}
			>
				{children}
			</EnabledNativePortal>
		</Animated.View>
	);
});
