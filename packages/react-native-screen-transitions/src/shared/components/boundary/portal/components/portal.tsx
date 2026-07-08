import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
} from "react";
import type { StyleProp, View, ViewProps, ViewStyle } from "react-native";
import Animated, { type AnimatedRef, runOnUI } from "react-native-reanimated";
import { logger } from "../../../../utils/logger";
import { usePlaceholderStyles } from "../hooks/use-placeholder-styles";
import { usePortalAttachment } from "../hooks/use-portal-attachment";
import { isTeleportAvailable, NativePortal } from "../teleport";

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

interface PortalProps {
	id?: string;
	children: ReactNode;
	handoff?: boolean;
	escapeClipping?: boolean;
	pointerEvents?: ViewProps["pointerEvents"];
	/**
	 * Ref to the layout-preserving placeholder wrapper. Boundaries measure
	 * this instead of teleported content — the placeholder keeps the source
	 * slot at home while the content may physically live in another screen's
	 * host.
	 */
	placeholderRef?: AnimatedRef<View>;
	placeholderStyle?: StyleProp<ViewStyle>;
}

export const Portal = memo(function Portal({
	id,
	children,
	handoff = false,
	escapeClipping = false,
	pointerEvents,
	placeholderRef,
	placeholderStyle: providedPlaceholderStyle,
}: PortalProps) {
	// Teleporting requires the optional `react-native-teleport` peer and a stable
	// `id` to name the boundary host. Missing either degrades to inline rendering
	// (the `return children` path below).
	const isPortalEnabled =
		(handoff || escapeClipping) && isTeleportAvailable && id !== undefined;

	if (__DEV__ && (handoff || escapeClipping) && id === undefined) {
		logger.warnOnce(
			"portal:missing-id",
			"A handoff or escapeClipping boundary was rendered without an id; rendering inline.",
		);
	}
	const boundaryId = id ?? "";
	const { teleportProps, visiblePortalHostName } = usePortalAttachment({
		boundaryId,
		escapeClipping,
		handoff,
		isPortalEnabled,
	});

	const { handleOnLayout, placeholderStyle } = usePlaceholderStyles({
		visiblePortalHostName,
	});

	if (isPortalEnabled && AnimatedNativePortal) {
		return (
			<Animated.View
				ref={placeholderRef}
				onLayout={({ nativeEvent: { layout } }) =>
					runOnUI(handleOnLayout)(layout)
				}
				style={[providedPlaceholderStyle, placeholderStyle]}
				pointerEvents={pointerEvents}
				collapsable={false}
			>
				<AnimatedNativePortal
					animatedProps={teleportProps}
					name={boundaryId}
					pointerEvents={pointerEvents}
					style={providedPlaceholderStyle}
				>
					{children}
				</AnimatedNativePortal>
			</Animated.View>
		);
	}

	return children;
});
