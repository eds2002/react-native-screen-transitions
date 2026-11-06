import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type AnimatedRef } from "react-native-reanimated";
import { logger } from "../../../../utils/logger";
import { usePlaceholderStyles } from "../hooks/use-placeholder-styles";
import {
	type PortalMode,
	usePortalDestination,
} from "../hooks/use-portal-destination";
import {
	isTeleportAvailable,
	NativePortal,
	PORTAL_POINTER_EVENTS,
} from "../teleport";
import { PortalHost } from "./portal-host";

type NullableHostNamePortalProps = Omit<
	ComponentProps<NonNullable<typeof NativePortal>>,
	"hostName"
> & { hostName?: string | null };
const AnimatedNativePortal = NativePortal
	? Animated.createAnimatedComponent(
			NativePortal as ComponentType<NullableHostNamePortalProps>,
		)
	: null;
const EnabledNativePortal = AnimatedNativePortal as NonNullable<
	typeof AnimatedNativePortal
>;

type PortalProps = {
	boundaryId?: string;
	children: ReactNode;
	enabled: boolean;
	mode: PortalMode;
	placeholderRef?: AnimatedRef<View>;
};

/**
 * Sends its children to a named PortalHost chosen on the UI thread.
 *
 * `handoff` moves the boundary's content between screens and creates a local
 * receiver inside this boundary. `escapeClipping` moves the whole boundary
 * frame into a PortalOverlay, leaving a sized placeholder at its original spot.
 * When both are enabled, the handoff portal lives inside the escaped frame.
 * Disabled portals, or apps without Teleport, render their children inline.
 */
export const Portal = memo(function Portal(props: PortalProps) {
	if (
		!props.enabled ||
		props.boundaryId === undefined ||
		!isTeleportAvailable ||
		!AnimatedNativePortal
	) {
		return props.children;
	}

	return <EnabledPortal {...props} boundaryId={props.boundaryId} />;
});

function EnabledPortal({
	boundaryId,
	children,
	mode,
	placeholderRef,
}: PortalProps & { boundaryId: string }) {
	if (__DEV__ && mode === "escapeClipping" && !boundaryId) {
		logger.warnOnce(
			"portal:missing-id",
			"A boundary portal was rendered without an id; rendering inline.",
		);
	}
	const { teleportProps, teleportDriver, localHostName, pinned } =
		usePortalDestination(boundaryId, mode);

	const content = (
		<>
			{teleportDriver}
			<EnabledNativePortal
				animatedProps={teleportProps}
				name={boundaryId}
				pointerEvents={PORTAL_POINTER_EVENTS}
				style={mode === "handoff" ? StyleSheet.absoluteFill : undefined}
			>
				{children}
			</EnabledNativePortal>
		</>
	);

	return mode === "handoff" ? (
		<>
			{content}
			<PortalHost name={localHostName} />
		</>
	) : (
		<PortalPlaceholder placeholderRef={placeholderRef} pinned={pinned}>
			{content}
		</PortalPlaceholder>
	);
}

// A plain view: its size is JS state, nothing animates it (an animated component costs each boundary
// a Reanimated wrapper for nothing). The UI thread measures it through its animated ref.
function PortalPlaceholder({
	children,
	pinned,
	placeholderRef,
}: Pick<PortalProps, "children" | "placeholderRef"> & { pinned: boolean }) {
	const { handleOnLayout, placeholderStyle } = usePlaceholderStyles(pinned);
	return (
		<View
			ref={placeholderRef}
			onLayout={handleOnLayout}
			style={placeholderStyle}
			pointerEvents={PORTAL_POINTER_EVENTS}
			collapsable={false}
		>
			{children}
		</View>
	);
}
