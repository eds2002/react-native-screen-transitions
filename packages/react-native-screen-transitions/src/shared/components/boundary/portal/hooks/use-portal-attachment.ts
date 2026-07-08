import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	runOnJS,
	useAnimatedProps,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../providers/screen/styles";
import { useRegisteredScreenSlots } from "../../../../providers/screen/styles/stores/slot-references.store";
import { AnimationStore } from "../../../../stores/animation.store";
import { pairs } from "../../../../stores/bounds/internals/state";
import { useActiveHostKey } from "../stores/host-registry.store";
import {
	dropStalePortalBoundaryHosts,
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";
import {
	createBoundaryHandoffPortalHostName,
	createPortalBoundaryHostName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";
import {
	canSwitchHandoffHostImmediately,
	type PortalOwnershipSignal,
	resolveBoundaryPortalOwnership,
} from "../utils/ownership";
import { shallowEqual } from "../utils/shallow-equal";
import { shouldAttachBoundaryPortal } from "../utils/teleport-control";
import { resolveNextVisiblePortalHostName } from "../utils/visible-host";

interface UsePortalAttachmentParams {
	boundaryId: string;
	escapeClipping: boolean;
	handoff: boolean;
	isPortalEnabled: boolean;
}

export const usePortalAttachment = ({
	boundaryId,
	escapeClipping,
	handoff,
	isPortalEnabled,
}: UsePortalAttachmentParams) => {
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
	const mountedPortalBoundaryHostNamesRef = useRef(new Set<string>());

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
	const settledHostClosing = AnimationStore.getValue(
		settledHostScreenKey ?? currentScreenKey,
		"closing",
	);
	const settledHostVisualProgress = AnimationStore.getValue(
		settledHostScreenKey ?? currentScreenKey,
		"visualProgress",
	);

	const escapeHostKey = useActiveHostKey(
		escapeClipping ? currentScreenKey : null,
	);
	const handoffHostName =
		handoff && targetScreenKey
			? createBoundaryHandoffPortalHostName(targetScreenKey, boundaryId)
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

	const unmountOwnedPortalBoundaryHosts = useCallback(() => {
		for (const portalHostName of mountedPortalBoundaryHostNamesRef.current) {
			unmountPortalBoundaryHostByName(portalHostName);
		}

		mountedPortalBoundaryHostNamesRef.current.clear();
	}, []);

	useLayoutEffect(() => {
		if (!isPortalEnabled || !ownership) {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountOwnedPortalBoundaryHosts();
			return;
		}

		if (handoffHostName) {
			requestedPortalHostName.set(handoffHostName);
			unmountOwnedPortalBoundaryHosts();
			return;
		}

		if (!escapeClipping || !escapeHostKey) {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountOwnedPortalBoundaryHosts();
			return;
		}

		const portalHostName = createPortalBoundaryHostName(
			escapeHostKey,
			boundaryId,
			ownership.ownerPairKey,
		);

		mountPortalBoundaryHost({
			boundaryId,
			escapeClipping,
			hostKey: escapeHostKey,
			localStylesMaps: activeLocalStylesMaps,
			pairKey: ownership.ownerPairKey,
			portalHostName,
			screenKey: currentScreenKey,
			slotsMap: activeSlotsMap,
		});
		mountedPortalBoundaryHostNamesRef.current.add(portalHostName);

		// Request the new receiver immediately, but keep the currently visible
		// receiver until the new interpolator is ready. This avoids a no-host gap
		// during A -> B(closing) -> C(opening) spam retargets.
		requestedPortalHostName.set(portalHostName);
	}, [
		escapeHostKey,
		boundaryId,
		currentScreenKey,
		escapeClipping,
		isPortalEnabled,
		activeLocalStylesMaps,
		activeSlotsMap,
		ownership,
		handoffHostName,
		requestedPortalHostName,
		unmountOwnedPortalBoundaryHosts,
		visiblePortalHostName,
	]);

	useLayoutEffect(() => {
		return () => {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountOwnedPortalBoundaryHosts();
		};
	}, [
		requestedPortalHostName,
		unmountOwnedPortalBoundaryHosts,
		visiblePortalHostName,
	]);

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

			return resolveBoundaryPortalOwnership({
				boundaryId,
				currentScreenKey,
				handoff,
				isSettledHostClosingComplete:
					!!settledHostClosing.get() &&
					settledHostVisualProgress.get() <= EPSILON,
				isSettledHostReady:
					settledHostProgress.get() === 1 && settledHostAnimating.get() === 0,
				pairsState: pairs.get(),
				settledHostScreenKey,
				sourcePairKey,
			});
		},
		(signal, previousSignal) => {
			"worklet";
			if (shallowEqual(previousSignal, signal)) {
				return;
			}

			if (!handoff) {
				canSwitchPortalHostImmediately.set(0);
			} else if (signal.status === "pending") {
				canSwitchPortalHostImmediately.set(0);
				return;
			} else {
				const hostScreenKey =
					signal.status === "complete" ? signal.hostScreenKey : null;
				let previousOwnerPairKey: string | undefined;

				if (previousSignal?.status === "complete") {
					previousOwnerPairKey = previousSignal.ownerPairKey ?? undefined;
				}
				const canSwitchImmediately = canSwitchHandoffHostImmediately({
					hostScreenKey,
					ownerPairKey:
						signal.status === "complete" ? signal.ownerPairKey : undefined,
					previousOwnerPairKey,
				});

				canSwitchPortalHostImmediately.set(canSwitchImmediately ? 1 : 0);

				if (canSwitchImmediately && hostScreenKey) {
					const hostName = createBoundaryHandoffPortalHostName(
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
			const shouldTeleport = shouldAttachBoundaryPortal({
				enabled: isPortalEnabled,
				teleport,
			});
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
		const shouldTeleport = shouldAttachBoundaryPortal({
			enabled: isPortalEnabled,
			teleport,
		});
		const visibleName = visiblePortalHostName.get();

		return {
			// Preserve portal slot props from the interpolator while keeping
			// hostName owned by the attachment gate below. Handoff
			// waits until the receiving interpolator owns styles for the same host;
			// after that, it stays attached until teleport is disabled or retargeted.
			...slotProps,
			hostName:
				shouldTeleport && visibleName
					? visibleName
					: PORTAL_HOST_NAME_RESET_VALUE,
		};
	});

	return {
		teleportProps,
		visiblePortalHostName,
	};
};
