import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
} from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
	type AnimatedRef,
	useAnimatedStyle,
} from "react-native-reanimated";
import { logger } from "../../../../utils/logger";
import { useBoundaryRootStore } from "../../root/boundary-root.provider";
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
	/** The escaping view's box (margins, position, size): the placeholder holds and measures it. */
	placeholderStyle?: StyleProp<ViewStyle>;
};

/**
 * Sends its children to a named PortalHost chosen on the UI thread.
 *
 * `handoff` moves the boundary's content between screens and creates a local
 * receiver inside this boundary. `escapeClipping` (every boundary, with Teleport)
 * moves the whole boundary frame into its screen's PortalOverlay while it takes
 * part in a transition, leaving a sized placeholder at its original spot. A
 * handoff portal lives inside the escaped frame.
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
	placeholderStyle,
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
				style={mode === "handoff" ? StyleSheet.absoluteFill : styles.fill}
			>
				{mode === "handoff" ? (
					<HandoffPayload>{children}</HandoffPayload>
				) : (
					children
				)}
			</EnabledNativePortal>
		</>
	);

	return mode === "handoff" ? (
		<>
			{content}
			<PortalHost name={localHostName} />
		</>
	) : (
		<PortalPlaceholder
			placeholderRef={placeholderRef}
			placeholderStyle={placeholderStyle}
			pinned={pinned}
		>
			{content}
		</PortalPlaceholder>
	);
}

/**
 * The handed-off content, sized to its receiver while it is in another screen's receiver. Content
 * moved by a portal is laid out through the portal, which learns the receiver's size from native
 * layout a frame later: a receiver animating its size would have the content trail it a frame
 * (a visible shake), and a move into a differently sized receiver would show one frame at the old
 * size. Setting the size here lands with the move and with every size change, in the same frame.
 */
function HandoffPayload({ children }: { children: ReactNode }) {
	const presentation = useBoundaryRootStore((s) => s.boundaryPresentation);
	const sizeStyle = useAnimatedStyle(() => {
		const size = presentation.get().receiverSize;
		return {
			width: size ? size.width : "100%",
			height: size ? size.height : "100%",
		};
	});
	return (
		<Animated.View
			style={sizeStyle}
			pointerEvents={PORTAL_POINTER_EVENTS}
			collapsable={false}
		>
			{children}
		</Animated.View>
	);
}

// A plain view: its size is JS state, nothing animates it (an animated component costs each boundary
// a Reanimated wrapper for nothing). The UI thread measures it through its animated ref.
function PortalPlaceholder({
	children,
	pinned,
	placeholderRef,
	placeholderStyle,
}: Pick<PortalProps, "children" | "placeholderRef" | "placeholderStyle"> & {
	pinned: boolean;
}) {
	const { handleOnLayout, placeholderStyle: pinnedStyle } =
		usePlaceholderStyles(pinned);
	return (
		<View
			ref={placeholderRef}
			onLayout={handleOnLayout}
			style={[placeholderStyle, pinnedStyle]}
			pointerEvents={PORTAL_POINTER_EVENTS}
			collapsable={false}
		>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	// The escaping view fills its placeholder (the placeholder is its box).
	fill: { flexGrow: 1 },
});
