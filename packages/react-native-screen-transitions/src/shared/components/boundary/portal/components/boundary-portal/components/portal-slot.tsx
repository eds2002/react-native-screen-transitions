import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
} from "react";
import type { View } from "react-native";
import Animated, { type AnimatedRef, runOnUI } from "react-native-reanimated";
import { logger } from "../../../../../../utils/logger";
import {
	isTeleportAvailable,
	PORTAL_POINTER_EVENTS,
	NativePortal as TeleportPortal,
} from "../../../teleport";
import { usePlaceholderStyles } from "../hooks/use-placeholder-styles";

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

type BoundaryPortalSlotProps = {
	id: string;
	children: ReactNode;
	enabled: boolean;
	animatedProps: any;
	placeholderRef?: AnimatedRef<View>;
};

export const BoundaryPortalSlot = memo(function BoundaryPortalSlot({
	id,
	children,
	enabled,
	animatedProps,
	placeholderRef,
}: BoundaryPortalSlotProps) {
	const isPortalEnabled = enabled && isTeleportAvailable;

	if (__DEV__ && enabled && !id) {
		logger.warnOnce(
			"portal:missing-id",
			"A boundary portal was rendered without an id; rendering inline.",
		);
	}

	const { handleOnLayout, placeholderStyle } = usePlaceholderStyles();

	if (isPortalEnabled && AnimatedNativePortal) {
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
				<AnimatedNativePortal
					animatedProps={animatedProps}
					name={id}
					pointerEvents={PORTAL_POINTER_EVENTS}
				>
					{children}
				</AnimatedNativePortal>
			</Animated.View>
		);
	}

	return children;
});
