import {
	type ComponentProps,
	type ComponentType,
	memo,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useState,
} from "react";
import type { View } from "react-native";
import Animated, {
	type AnimatedRef,
	runOnJS,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../providers/screen/styles";
import { getLinkKeyFromTag } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { getLink } from "../../../../stores/bounds/internals/links";
import { pairs } from "../../../../stores/bounds/internals/state";
import { createTransitionAwareComponent } from "../../../create-transition-aware-component";
import type { BoundaryPortal, BoundaryPortalAttachTarget } from "../../types";
import {
	getHostCapturesScroll,
	useActiveHostKey,
} from "../stores/host-registry.store";
import {
	mountPortalBoundaryHost,
	retainPortalBoundaryHost,
	unmountPortalBoundaryHost,
} from "../stores/portal-boundary-host.store";
import {
	type PortalAttachment,
	resolvePortalAttachmentTargets,
} from "../utils/attachment";
import {
	createPortalBoundaryHostName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";
import { isTeleportEnabled } from "../utils/teleport-control";
import { isTeleportAvailable, NativePortal } from "./teleport";

type NullableHostNamePortalProps = Omit<
	ComponentProps<NonNullable<typeof NativePortal>>,
	"hostName"
> & {
	hostName?: string | null;
};

const TransitionAwareTeleport = NativePortal
	? createTransitionAwareComponent(
			NativePortal as ComponentType<NullableHostNamePortalProps>,
		)
	: null;

interface PortalProps {
	id?: string;
	children: ReactNode;
	mode?: BoundaryPortal;
	/**
	 * Ref to the layout-preserving placeholder wrapper. Boundaries measure
	 * this instead of teleported content — the placeholder keeps the source
	 * slot at home while the content may physically live in another screen's
	 * host.
	 */
	placeholderRef?: AnimatedRef<View>;
}

export const Portal = memo(function Portal({
	id = "my-id",
	children,
	mode = false,
	placeholderRef,
}: PortalProps) {
	// Teleporting requires the optional `react-native-teleport` peer. Without it,
	// a portal-enabled boundary degrades to inline rendering (the `return
	// children` path below).
	const isPortalEnabled = !!mode && isTeleportAvailable;
	const portalAttachTarget: BoundaryPortalAttachTarget =
		!mode || mode === true
			? "current-screen"
			: (mode.attachTo ?? "current-screen");
	const { localStylesMaps, nextInterpolatorReady, slotsMap } = useScreenSlots();
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);

	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);

	const [attachment, setAttachment] = useState<PortalAttachment | null>(
		PORTAL_HOST_NAME_RESET_VALUE,
	);
	const requestedHostKey = useSharedValue<string | null>(null);
	const visibleHostKey = useSharedValue<string | null>(null);
	const placeholderWidth = useSharedValue(0);
	const placeholderHeight = useSharedValue(0);

	const { targetScreenKey } = resolvePortalAttachmentTargets({
		attachment,
		currentScreenKey,
		nextScreenKey,
		portalAttachTarget,
		sourcePairKey,
	});

	const activeHostKey = useActiveHostKey(targetScreenKey);
	const activeHostCapturesScroll = activeHostKey
		? getHostCapturesScroll(activeHostKey)
		: false;

	const updatePortalAttachment = useCallback(
		(matchedScreenKey: string | null, pairKey?: string) => {
			if (matchedScreenKey && pairKey) {
				setAttachment((current) => {
					if (
						current?.matchedScreenKey === matchedScreenKey &&
						current.pairKey === pairKey
					) {
						return current;
					}

					return {
						matchedScreenKey,
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
			requestedHostKey.set(null);
			visibleHostKey.set(null);
			unmountPortalBoundaryHost(id);
			return;
		}

		mountPortalBoundaryHost({
			boundaryId: id,
			capturesScroll: activeHostCapturesScroll,
			hostKey: activeHostKey,
			localStylesMaps,
			pairKey: attachment.pairKey,
			screenKey: targetScreenKey,
			slotsMap,
		});

		// Request the new receiver immediately, but keep the currently visible
		// receiver until the new interpolator is ready. This avoids a no-host gap
		// during A -> B(closing) -> C(opening) spam retargets.
		requestedHostKey.set(activeHostKey);
	}, [
		activeHostKey,
		activeHostCapturesScroll,
		attachment,
		id,
		isPortalEnabled,
		localStylesMaps,
		requestedHostKey,
		slotsMap,
		targetScreenKey,
		visibleHostKey,
	]);

	useLayoutEffect(() => {
		return () => {
			requestedHostKey.set(null);
			visibleHostKey.set(null);
			unmountPortalBoundaryHost(id);
		};
	}, [id, requestedHostKey, visibleHostKey]);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!isPortalEnabled || !sourcePairKey) {
				return {
					matchedScreenKey: null,
					pairKey: sourcePairKey,
					status: "clear",
				};
			}

			pairs.get();
			// Strict per-member lookup: getResolvedLink's group fallback borrows
			// the initial member's link for style resolution, which would make
			// every inactive group member's portal see a "complete" link and
			// attach. A portal may only teleport on its OWN member's link.
			const link = getLink(sourcePairKey, id);

			if (link?.status !== "complete") {
				return {
					matchedScreenKey: null,
					pairKey: sourcePairKey,
					status: "pending",
				};
			}

			// Grouped portals teleport only while their member is the group's
			// active id — retargeting detaches the previous member (its content
			// returns home) and attaches the new one. Exactly one grouped member
			// is teleported at a time.
			if (link.group) {
				const activeId =
					pairs.get()[sourcePairKey]?.groups?.[link.group]?.activeId;

				if (activeId && activeId !== getLinkKeyFromTag(id)) {
					return {
						matchedScreenKey: null,
						pairKey: sourcePairKey,
						status: "clear",
					};
				}
			}

			return {
				matchedScreenKey: link.destination.screenKey,
				pairKey: sourcePairKey,
				status: "complete",
			};
		},
		(signal, previousSignal) => {
			"worklet";
			if (
				previousSignal &&
				signal.status === previousSignal.status &&
				signal.matchedScreenKey === previousSignal.matchedScreenKey &&
				signal.pairKey === previousSignal.pairKey
			) {
				return;
			}

			if (signal.status === "pending") {
				return;
			}

			runOnJS(updatePortalAttachment)(
				signal.matchedScreenKey,
				signal.pairKey ?? undefined,
			);
		},
	);

	useAnimatedReaction(
		() => {
			"worklet";
			const slot = slotsMap.get()[id];
			const teleport = slot?.props?.teleport;
			const shouldTeleport = isTeleportEnabled(teleport);
			const requestedKey = requestedHostKey.get();
			const visibleKey = visibleHostKey.get();
			const isInterpolatorReady = nextInterpolatorReady.get();
			const nextVisibleKey =
				shouldTeleport && isInterpolatorReady && requestedKey
					? requestedKey
					: shouldTeleport
						? visibleKey
						: null;

			return {
				isInterpolatorReady,
				nextVisibleKey,
				requestedKey,
				shouldTeleport,
				teleport,
				visibleKey,
			};
		},
		(state, previousState) => {
			"worklet";
			if (
				previousState &&
				state.isInterpolatorReady === previousState.isInterpolatorReady &&
				state.nextVisibleKey === previousState.nextVisibleKey &&
				state.requestedKey === previousState.requestedKey &&
				state.shouldTeleport === previousState.shouldTeleport &&
				state.teleport === previousState.teleport &&
				state.visibleKey === previousState.visibleKey
			) {
				return;
			}

			if (state.nextVisibleKey !== state.visibleKey) {
				visibleHostKey.set(state.nextVisibleKey);
				return;
			}

			if (
				state.visibleKey &&
				state.visibleKey === state.requestedKey &&
				state.requestedKey
			) {
				runOnJS(retainPortalBoundaryHost)({
					boundaryId: id,
					hostKey: state.requestedKey,
				});
			}
		},
	);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[id];
		const { teleport, ...slotProps } = slot?.props ?? {};
		const shouldTeleport = isTeleportEnabled(teleport);
		const visibleKey = visibleHostKey.get();

		return {
			// Preserve portal slot props from the interpolator while keeping
			// hostName owned by the attachment gate below. Matched-screen handoff
			// waits until the destination interpolator owns styles for the same host;
			// after that, it stays attached until teleport is disabled or retargeted.
			...slotProps,
			hostName:
				shouldTeleport && visibleKey
					? createPortalBoundaryHostName(visibleKey, id)
					: PORTAL_HOST_NAME_RESET_VALUE,
		};
	});

	// Pin the placeholder to its measured size while content lives in the host,
	// in the same UI frame the host name flips — no commit in between. Until the
	// first layout lands (dims 0) sizing stays natural so an instant attach
	// cannot collapse the slot.
	const placeholderStyle = useAnimatedStyle(() => {
		"worklet";
		const isAttached = visibleHostKey.get() !== null;
		const width = placeholderWidth.get();
		const height = placeholderHeight.get();

		if (!isAttached || width === 0) {
			return { width: "auto", height: "auto" } as const;
		}

		return { width, height };
	});

	if (isPortalEnabled && TransitionAwareTeleport) {
		return (
			<Animated.View
				ref={placeholderRef}
				onLayout={(event) => {
					placeholderWidth.set(event.nativeEvent.layout.width);
					placeholderHeight.set(event.nativeEvent.layout.height);
				}}
				style={placeholderStyle}
				collapsable={false}
			>
				<TransitionAwareTeleport animatedProps={teleportProps} name={id}>
					<Animated.View style={placeholderStyle}>{children}</Animated.View>
				</TransitionAwareTeleport>
			</Animated.View>
		);
	}

	return children;
});
