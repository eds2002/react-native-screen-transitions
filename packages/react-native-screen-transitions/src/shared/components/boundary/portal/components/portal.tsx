import {
	memo,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useState,
} from "react";
import Animated, {
	runOnJS,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { Portal as NativePortal } from "react-native-teleport";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { useScreenStyles } from "../../../../providers/screen/styles";
import { getResolvedLink } from "../../../../stores/bounds/internals/links";
import { pairs } from "../../../../stores/bounds/internals/state";
import { createTransitionAwareComponent } from "../../../create-transition-aware-component";
import type { BoundaryPortal } from "../../types";
import {
	getHostCapturesScroll,
	useActiveHostKey,
} from "../stores/host-registry.store";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHost,
} from "../stores/portal-boundary-host.store";
import {
	createPortalBoundaryHostName,
	createPortalName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";

const TransitionAwareTeleport = createTransitionAwareComponent(NativePortal);

interface PortalProps {
	id?: string;
	children: ReactNode;
	mode?: BoundaryPortal;
}

type PortalHostMode = "current-screen" | "paired-screen";

type PortalAttachment = {
	pairedScreenKey: string;
	pairKey: string;
};

export const Portal = memo(function Portal({
	id = "my-id",
	children,
	mode = false,
}: PortalProps) {
	const styleId = createPortalName(id);
	const isPortalEnabled = !!mode;
	const portalHostMode: PortalHostMode =
		!mode || mode === true ? "current-screen" : mode.host;
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const { stylesMap } = useScreenStyles();

	const [attachment, setAttachment] = useState<PortalAttachment | null>(null);
	const attachedHostName = useSharedValue(PORTAL_HOST_NAME_RESET_VALUE);
	const placeholderWidth = useSharedValue(0);
	const placeholderHeight = useSharedValue(0);

	const targetScreenKey =
		portalHostMode === "paired-screen"
			? attachment?.pairedScreenKey
			: currentScreenKey;
	const activeHostKey = useActiveHostKey(attachment ? targetScreenKey : null);
	const activeHostCapturesScroll = activeHostKey
		? getHostCapturesScroll(activeHostKey)
		: false;

	const updatePortalAttachment = useCallback(
		(pairedScreenKey: string | null, pairKey?: string) => {
			if (pairedScreenKey && pairKey) {
				setAttachment((current) => {
					if (
						current?.pairedScreenKey === pairedScreenKey &&
						current.pairKey === pairKey
					) {
						return current;
					}

					return {
						pairedScreenKey,
						pairKey,
					};
				});
				return;
			}

			setAttachment((current) => (current ? null : current));
		},
		[],
	);

	useLayoutEffect(() => {
		if (!isPortalEnabled || !attachment || !activeHostKey || !targetScreenKey) {
			attachedHostName.set(PORTAL_HOST_NAME_RESET_VALUE);
			unmountPortalBoundaryHost(id);
			return;
		}

		mountPortalBoundaryHost({
			boundaryId: id,
			capturesScroll: activeHostCapturesScroll,
			hostKey: activeHostKey,
			pairKey: attachment.pairKey,
			screenKey: targetScreenKey,
		});

		// The native registry parks portals whose host has not registered yet and
		// re-parents the moment it does, so the host name can be handed over
		// immediately — ordering belongs to the registry, not to frame counting.
		// hostName rides animated props, so the handover needs no React commit.
		attachedHostName.set(createPortalBoundaryHostName(activeHostKey, id));

		return () => {
			attachedHostName.set(PORTAL_HOST_NAME_RESET_VALUE);
			unmountPortalBoundaryHost(id);
		};
	}, [
		activeHostKey,
		activeHostCapturesScroll,
		attachedHostName,
		attachment,
		id,
		isPortalEnabled,
		targetScreenKey,
	]);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!isPortalEnabled || !sourcePairKey) {
				return null;
			}

			pairs.get();
			const link = getResolvedLink(sourcePairKey, id).link;

			if (link?.status !== "complete") {
				return null;
			}

			return link.destination.screenKey;
		},
		(pairedScreenKey, previousPairedScreenKey) => {
			"worklet";
			if (pairedScreenKey === previousPairedScreenKey) {
				return;
			}

			runOnJS(updatePortalAttachment)(pairedScreenKey, sourcePairKey);
		},
	);

	const teleportProps = useAnimatedProps(() => {
		"worklet";
		return {
			// Keep the styleId-driven props channel alive (the wrapper's user
			// animatedProps would otherwise replace it); the portal owns hostName.
			...stylesMap.get()[styleId]?.props,
			hostName:
				attachedHostName.get() === PORTAL_HOST_NAME_RESET_VALUE
					? (null as any)
					: attachedHostName.get(),
		};
	});

	// Pin the placeholder to its measured size while content lives in the host,
	// in the same UI frame the host name flips — no commit in between. Until the
	// first layout lands (dims 0) sizing stays natural so an instant attach
	// cannot collapse the slot.
	const placeholderStyle = useAnimatedStyle(() => {
		"worklet";
		const isAttached = attachedHostName.get() !== PORTAL_HOST_NAME_RESET_VALUE;
		const width = placeholderWidth.get();
		const height = placeholderHeight.get();

		if (!isAttached || width === 0) {
			return { width: "auto", height: "auto" } as const;
		}

		return { width, height };
	});

	if (isPortalEnabled) {
		return (
			<Animated.View
				onLayout={(event) => {
					placeholderWidth.set(event.nativeEvent.layout.width);
					placeholderHeight.set(event.nativeEvent.layout.height);
				}}
				style={placeholderStyle}
			>
				<TransitionAwareTeleport animatedProps={teleportProps} name={styleId}>
					{children}
				</TransitionAwareTeleport>
			</Animated.View>
		);
	}

	return children;
});
