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
import { AnimationStore } from "../../../../stores/animation.store";
import { pairs } from "../../../../stores/bounds/internals/state";
import type { BoundsPortalHost } from "../../../../stores/bounds/types";
import { logger } from "../../../../utils/logger";
import { createTransitionAwareComponent } from "../../../create-transition-aware-component";
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
	createBoundaryLocalPortalHostName,
	createPortalBoundaryHostName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";
import {
	canSwitchBoundaryLocalPortalHostImmediately,
	type PortalOwnershipSignal,
	resolveMatchedScreenPortalOwnership,
} from "../utils/ownership";
import { shallowEqual } from "../utils/shallow-equal";
import { isTeleportEnabled } from "../utils/teleport-control";
import { resolveNextVisiblePortalHostName } from "../utils/visible-host";

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
	portalHost?: BoundsPortalHost;
	/**
	 * Ref to the layout-preserving placeholder wrapper. Boundaries measure
	 * this instead of teleported content — the placeholder keeps the source
	 * slot at home while the content may physically live in another screen's
	 * host.
	 */
	placeholderRef?: AnimatedRef<View>;
	placeholderChildren?: ReactNode;
}

export const Portal = memo(function Portal({
	id,
	children,
	portalHost,
	placeholderRef,
	placeholderChildren,
}: PortalProps) {
	// Teleporting requires the optional `react-native-teleport` peer and a stable
	// `id` to name the boundary host. Missing either degrades to inline rendering
	// (the `return children` path below).
	const isPortalEnabled =
		!!portalHost && isTeleportAvailable && id !== undefined;
	if (__DEV__ && portalHost && id === undefined) {
		logger.warnOnce(
			"portal:missing-id",
			"A portal-enabled boundary was rendered without an id; rendering inline.",
		);
	}
	const boundaryId = id ?? "";
	const ownScreenSlots = useScreenSlots();
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);

	const [ownership, setOwnership] = useState<Extract<
		PortalOwnershipSignal,
		{ status: "complete" }
	> | null>(null);
	const styleOwnerScreenKey = ownership?.ownerScreenKey ?? currentScreenKey;
	const ownerScreenSlots = useRegisteredScreenSlots(styleOwnerScreenKey);
	const activeScreenSlots = ownerScreenSlots ?? ownScreenSlots;
	const {
		localStylesMaps: activeLocalStylesMaps,
		nextInterpolatorReady: activeNextInterpolatorReady,
		slotsMap: activeSlotsMap,
	} = activeScreenSlots;
	const requestedPortalHostName = useSharedValue<string | null>(null);
	const visiblePortalHostName = useSharedValue<string | null>(null);
	const canSwitchPortalHostImmediately = useSharedValue(0);
	const placeholderWidth = useSharedValue(0);
	const placeholderHeight = useSharedValue(0);

	const targetScreenKey = ownership ? ownership.hostScreenKey : null;
	const settledHostScreenKey = ownership?.hostScreenKey ?? null;
	const settledHostProgress = AnimationStore.getValue(
		settledHostScreenKey ?? currentScreenKey,
		"progressSettled",
	);
	const settledHostAnimating = AnimationStore.getValue(
		settledHostScreenKey ?? currentScreenKey,
		"progressAnimating",
	);

	const activeHostKey = useActiveHostKey(targetScreenKey);
	const activeHostCapturesScroll = activeHostKey
		? getHostCapturesScroll(activeHostKey)
		: false;
	const boundaryLocalHostName =
		portalHost === "boundary-local" && targetScreenKey
			? createBoundaryLocalPortalHostName(targetScreenKey, boundaryId)
			: null;

	const updatePortalOwnership = useCallback(
		(
			hostScreenKey: string | null,
			ownerPairKey?: string,
			ownerScreenKey?: string,
		) => {
			if (hostScreenKey && ownerPairKey && ownerScreenKey) {
				setOwnership((current) => {
					if (
						current?.hostScreenKey === hostScreenKey &&
						current.ownerPairKey === ownerPairKey &&
						current.ownerScreenKey === ownerScreenKey
					) {
						return current;
					}

					return {
						hostScreenKey,
						ownerPairKey,
						ownerScreenKey,
						status: "complete",
					};
				});
				return;
			}

			setOwnership((current) => (current ? null : current));
		},
		[],
	);

	useLayoutEffect(() => {
		if (!isPortalEnabled || !ownership || !targetScreenKey) {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountPortalBoundaryHost(boundaryId);
			return;
		}

		if (boundaryLocalHostName) {
			requestedPortalHostName.set(boundaryLocalHostName);
			unmountPortalBoundaryHost(boundaryId);
			return;
		}

		if (!activeHostKey) {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountPortalBoundaryHost(boundaryId);
			return;
		}

		const portalHostName = createPortalBoundaryHostName(
			activeHostKey,
			boundaryId,
			ownership.ownerPairKey,
		);

		mountPortalBoundaryHost({
			boundaryId,
			capturesScroll: activeHostCapturesScroll,
			hostKey: activeHostKey,
			localStylesMaps: activeLocalStylesMaps,
			pairKey: ownership.ownerPairKey,
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
		boundaryId,
		isPortalEnabled,
		activeLocalStylesMaps,
		activeSlotsMap,
		ownership,
		boundaryLocalHostName,
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
					hostScreenKey: null,
					ownerPairKey: sourcePairKey,
					ownerScreenKey: null,
					status: "clear",
				};
			}

			return resolveMatchedScreenPortalOwnership({
				boundaryId,
				isSettledHostReady:
					settledHostProgress.get() === 1 && settledHostAnimating.get() === 0,
				pairsState: pairs.get(),
				portalHost,
				settledHostScreenKey,
				sourcePairKey,
			});
		},
		(signal, previousSignal) => {
			"worklet";
			if (shallowEqual(previousSignal, signal)) {
				return;
			}

			if (portalHost !== "boundary-local") {
				canSwitchPortalHostImmediately.set(0);
			} else if (signal.status === "pending") {
				canSwitchPortalHostImmediately.set(0);
				return;
			} else {
				const hostScreenKey =
					signal.status === "complete" ? signal.hostScreenKey : null;
				const previousOwnerPairKey =
					previousSignal?.status === "complete"
						? previousSignal.ownerPairKey
						: undefined;
				const canSwitchImmediately =
					canSwitchBoundaryLocalPortalHostImmediately({
						hostScreenKey,
						ownerPairKey:
							signal.status === "complete" ? signal.ownerPairKey : undefined,
						previousOwnerPairKey,
					});

				canSwitchPortalHostImmediately.set(canSwitchImmediately ? 1 : 0);

				if (canSwitchImmediately && hostScreenKey) {
					const hostName = createBoundaryLocalPortalHostName(
						hostScreenKey,
						boundaryId,
					);
					requestedPortalHostName.set(hostName);
					visiblePortalHostName.set(hostName);
				}
			}

			runOnJS(updatePortalOwnership)(
				signal.hostScreenKey,
				signal.ownerPairKey,
				signal.ownerScreenKey ?? undefined,
			);
		},
	);

	useAnimatedReaction(
		() => {
			"worklet";
			const slot = activeSlotsMap.get()[boundaryId];
			const teleport = slot?.props?.teleport;
			const shouldTeleport = !!portalHost || isTeleportEnabled(teleport);
			const requestedName = requestedPortalHostName.get();
			const visibleName = visiblePortalHostName.get();
			const isInterpolatorReady = activeNextInterpolatorReady.get();
			const nextVisibleName = resolveNextVisiblePortalHostName({
				canSwitchImmediately: canSwitchPortalHostImmediately.get() === 1,
				isInterpolatorReady: isInterpolatorReady === 1,
				requestedName,
				shouldTeleport,
				visibleName,
			});

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
		const shouldTeleport = !!portalHost || isTeleportEnabled(teleport);
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
				{placeholderChildren}
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
