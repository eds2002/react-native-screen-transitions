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
import { useRegisteredScreenSlots } from "../../../../providers/screen/styles/stores/slot-references.store";
import {
	getLinkKeyFromTag,
	getLink as getPairLink,
	getSourceScreenKeyFromPairKey,
} from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../../../stores/bounds/internals/state";
import type {
	BoundsPortalAttachTarget,
	LinkKey,
	LinkPairsState,
	ScreenPairKey,
	TagLink,
} from "../../../../stores/bounds/types";
import { logger } from "../../../../utils/logger";
import { createTransitionAwareComponent } from "../../../create-transition-aware-component";
import type { BoundaryPortal } from "../../types";
import {
	getHostCapturesScroll,
	useActiveHostKey,
} from "../stores/host-registry.store";
import {
	dropStalePortalBoundaryHosts,
	mountPortalBoundaryHost,
	unmountPortalBoundaryHost,
} from "../stores/portal-boundary-host.store";
import { isTeleportAvailable, NativePortal } from "../teleport";
import {
	type PortalAttachment,
	resolvePortalAttachmentTargets,
} from "../utils/attachment";
import {
	createPortalBoundaryHostName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";
import { resolvePortalHost } from "../utils/resolve-portal";
import { shallowEqual } from "../utils/shallow-equal";
import { isTeleportEnabled } from "../utils/teleport-control";

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

type PortalAttachmentSignal =
	| {
			matchedScreenKey: null;
			pairKey?: ScreenPairKey;
			status: "clear" | "pending";
	  }
	| {
			matchedScreenKey: string;
			pairKey: ScreenPairKey;
			status: "complete";
	  };

const isActivePortalLink = ({
	link,
	linkKey,
	pairKey,
	pairsState,
}: {
	link: TagLink;
	linkKey: LinkKey;
	pairKey: ScreenPairKey;
	pairsState: LinkPairsState;
}) => {
	"worklet";
	if (!link.group) {
		return true;
	}

	const activeId = pairsState[pairKey]?.groups?.[link.group]?.activeId;
	return !activeId || activeId === linkKey;
};

const resolveMatchedScreenAttachmentSignal = ({
	boundaryId,
	pairsState,
	portalAttachTarget,
	sourcePairKey,
}: {
	boundaryId: string;
	pairsState: LinkPairsState;
	portalAttachTarget: BoundsPortalAttachTarget;
	sourcePairKey: ScreenPairKey;
}): PortalAttachmentSignal => {
	"worklet";
	const linkKey = getLinkKeyFromTag(boundaryId);
	const link = getPairLink(pairsState, sourcePairKey, linkKey);

	if (link?.status !== "complete") {
		return {
			matchedScreenKey: null,
			pairKey: sourcePairKey,
			status: "pending",
		};
	}

	if (
		!isActivePortalLink({
			link,
			linkKey,
			pairKey: sourcePairKey,
			pairsState,
		})
	) {
		return {
			matchedScreenKey: null,
			pairKey: sourcePairKey,
			status: "clear",
		};
	}

	let matchedScreenKey = link.destination.screenKey;
	let activePairKey = sourcePairKey;

	if (portalAttachTarget !== "matched-screen") {
		return {
			matchedScreenKey,
			pairKey: activePairKey,
			status: "complete",
		};
	}

	const pairKeys = Object.keys(pairsState);

	for (let hop = 0; hop < pairKeys.length; hop++) {
		let didAdvance = false;
		let hasPendingNextHop = false;

		for (let index = 0; index < pairKeys.length; index++) {
			const candidatePairKey = pairKeys[index];
			if (!candidatePairKey || candidatePairKey === activePairKey) {
				continue;
			}

			const candidate = getPairLink(pairsState, candidatePairKey, linkKey);
			if (
				!candidate?.source ||
				candidate.source.screenKey !== matchedScreenKey
			) {
				continue;
			}

			if (
				!isActivePortalLink({
					link: candidate,
					linkKey,
					pairKey: candidatePairKey,
					pairsState,
				})
			) {
				continue;
			}

			if (candidate.status !== "complete") {
				hasPendingNextHop = true;
				continue;
			}

			activePairKey = candidatePairKey;
			matchedScreenKey = candidate.destination.screenKey;
			didAdvance = true;
			break;
		}

		if (didAdvance) {
			continue;
		}

		if (hasPendingNextHop) {
			return {
				matchedScreenKey: null,
				pairKey: activePairKey,
				status: "pending",
			};
		}

		break;
	}

	return {
		matchedScreenKey,
		pairKey: activePairKey,
		status: "complete",
	};
};

interface PortalProps {
	id?: string;
	children: ReactNode;
	portal?: BoundaryPortal;
	/**
	 * Ref to the layout-preserving placeholder wrapper. Boundaries measure
	 * this instead of teleported content — the placeholder keeps the source
	 * slot at home while the content may physically live in another screen's
	 * host.
	 */
	placeholderRef?: AnimatedRef<View>;
}

export const Portal = memo(function Portal({
	id,
	children,
	portal = false,
	placeholderRef,
}: PortalProps) {
	// Teleporting requires the optional `react-native-teleport` peer and a stable
	// `id` to name the boundary host. Missing either degrades to inline rendering
	// (the `return children` path below).
	const isPortalEnabled = !!portal && isTeleportAvailable && id !== undefined;
	if (__DEV__ && portal && id === undefined) {
		logger.warnOnce(
			"portal:missing-id",
			"A portal-enabled boundary was rendered without an id; rendering inline.",
		);
	}
	const boundaryId = id ?? "";
	const portalAttachTarget: BoundsPortalAttachTarget =
		resolvePortalHost(portal) ?? "current-screen";
	const ownScreenSlots = useScreenSlots();
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);

	const [attachment, setAttachment] = useState<PortalAttachment | null>(null);
	const styleOwnerScreenKey = attachment
		? getSourceScreenKeyFromPairKey(attachment.pairKey)
		: currentScreenKey;
	const ownerScreenSlots = useRegisteredScreenSlots(styleOwnerScreenKey);
	const activeScreenSlots = ownerScreenSlots ?? ownScreenSlots;
	const {
		localStylesMaps: activeLocalStylesMaps,
		nextInterpolatorReady: activeNextInterpolatorReady,
		slotsMap: activeSlotsMap,
	} = activeScreenSlots;
	const requestedPortalHostName = useSharedValue<string | null>(null);
	const visiblePortalHostName = useSharedValue<string | null>(null);
	const placeholderWidth = useSharedValue(0);
	const placeholderHeight = useSharedValue(0);

	const { targetScreenKey } = resolvePortalAttachmentTargets({
		attachment,
		currentScreenKey,
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
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountPortalBoundaryHost(boundaryId);
			return;
		}

		const portalHostName = createPortalBoundaryHostName(
			activeHostKey,
			boundaryId,
			attachment.pairKey,
		);

		mountPortalBoundaryHost({
			boundaryId,
			capturesScroll: activeHostCapturesScroll,
			hostKey: activeHostKey,
			localStylesMaps: activeLocalStylesMaps,
			pairKey: attachment.pairKey,
			portalHostName,
			screenKey: targetScreenKey,
			slotsMap: activeSlotsMap,
		});

		// Request the new receiver immediately, but keep the currently visible
		// receiver until the new interpolator is ready. This avoids a no-host gap
		// during A -> B(closing) -> C(opening) spam retargets.
		requestedPortalHostName.set(portalHostName);
	}, [
		activeHostKey,
		activeHostCapturesScroll,
		attachment,
		boundaryId,
		isPortalEnabled,
		activeLocalStylesMaps,
		activeSlotsMap,
		requestedPortalHostName,
		targetScreenKey,
		visiblePortalHostName,
	]);

	useLayoutEffect(() => {
		return () => {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountPortalBoundaryHost(boundaryId);
		};
	}, [boundaryId, requestedPortalHostName, visiblePortalHostName]);

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

			return resolveMatchedScreenAttachmentSignal({
				boundaryId,
				pairsState: pairs.get(),
				portalAttachTarget,
				sourcePairKey,
			});
		},
		(signal, previousSignal) => {
			"worklet";
			if (shallowEqual(previousSignal, signal)) {
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
			const slot = activeSlotsMap.get()[boundaryId];
			const teleport = slot?.props?.teleport;
			const shouldTeleport = isTeleportEnabled(teleport);
			const requestedName = requestedPortalHostName.get();
			const visibleName = visiblePortalHostName.get();
			const isInterpolatorReady = activeNextInterpolatorReady.get();

			let nextVisibleName: string | null;
			if (!shouldTeleport) {
				nextVisibleName = null;
			} else if (isInterpolatorReady && requestedName) {
				// Hand off once the next interpolator owns its styles.
				nextVisibleName = requestedName;
			} else {
				// Hold the currently visible receiver until the request is drawable.
				nextVisibleName = visibleName;
			}

			return {
				isInterpolatorReady,
				nextVisibleName,
				requestedName,
				shouldTeleport,
				teleport,
				visibleName,
			};
		},
		(state, previousState) => {
			"worklet";
			if (shallowEqual(previousState, state)) {
				return;
			}

			if (state.nextVisibleName !== state.visibleName) {
				visiblePortalHostName.set(state.nextVisibleName);
				return;
			}

			// Visible receiver has caught up to the request: GC the superseded hosts.
			if (state.visibleName && state.visibleName === state.requestedName) {
				runOnJS(dropStalePortalBoundaryHosts)({
					boundaryId,
					keepPortalHostName: state.visibleName,
				});
			}
		},
	);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = activeSlotsMap.get()[boundaryId];
		const { teleport, ...slotProps } = slot?.props ?? {};
		const shouldTeleport = isTeleportEnabled(teleport);
		const visibleName = visiblePortalHostName.get();

		return {
			// Preserve portal slot props from the interpolator while keeping
			// hostName owned by the attachment gate below. Matched-screen handoff
			// waits until the destination interpolator owns styles for the same host;
			// after that, it stays attached until teleport is disabled or retargeted.
			...slotProps,
			hostName:
				shouldTeleport && visibleName
					? visibleName
					: PORTAL_HOST_NAME_RESET_VALUE,
		};
	});

	// Pin the placeholder to its measured size while content lives in the host,
	// in the same UI frame the host name flips — no commit in between. Until the
	// first layout lands (dims 0) sizing stays natural so an instant attach
	// cannot collapse the slot.
	const placeholderStyle = useAnimatedStyle(() => {
		"worklet";
		const isAttached = visiblePortalHostName.get() !== null;
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
				<TransitionAwareTeleport
					animatedProps={teleportProps}
					name={boundaryId}
				>
					<Animated.View style={placeholderStyle}>{children}</Animated.View>
				</TransitionAwareTeleport>
			</Animated.View>
		);
	}

	return children;
});
