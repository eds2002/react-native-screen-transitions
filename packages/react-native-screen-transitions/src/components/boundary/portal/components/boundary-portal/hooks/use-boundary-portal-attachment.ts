import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	useAnimatedProps,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../../../providers/screen/styles";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import {
	type PortalOwnershipSignal,
	resolveBoundaryPortalOwnership,
} from "../../../utils/ownership";
import { shallowEqual } from "../../../utils/shallow-equal";
import { shouldAttachBoundaryPortal } from "../../../utils/teleport-control";
import { resolveNextVisiblePortalHostName } from "../../../utils/visible-host";
import { createBoundaryPortalHostName } from "../helpers/host-name";
import { useActiveHostKey } from "../stores/host-registry.store";
import {
	dropStalePortalBoundaryHosts,
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";

interface UseBoundaryPortalAttachmentParams {
	boundaryId: string;
	enabled: boolean;
}

export const useBoundaryPortalAttachment = ({
	boundaryId,
	enabled,
}: UseBoundaryPortalAttachmentParams) => {
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const { localStylesMaps, nextInterpolatorReady, slotsMap } = useScreenSlots();
	const [ownership, setOwnership] = useState<Extract<
		PortalOwnershipSignal,
		{ status: "complete" }
	> | null>(null);
	const requestedPortalHostName = useSharedValue<string | null>(null);
	const visiblePortalHostName = useSharedValue<string | null>(null);
	const mountedPortalBoundaryHostNamesRef = useRef(new Set<string>());
	const escapeHostKey = useActiveHostKey(enabled ? currentScreenKey : null);

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
		if (!enabled || !ownership || !escapeHostKey) {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			unmountOwnedPortalBoundaryHosts();
			return;
		}

		const portalHostName = createBoundaryPortalHostName(
			escapeHostKey,
			boundaryId,
			ownership.ownerPairKey,
		);

		mountPortalBoundaryHost({
			boundaryId,
			escapeClipping: true,
			hostKey: escapeHostKey,
			localStylesMaps,
			pairKey: ownership.ownerPairKey,
			portalHostName,
			screenKey: currentScreenKey,
			slotsMap,
		});
		mountedPortalBoundaryHostNamesRef.current.add(portalHostName);

		// Request the new receiver immediately, but keep the currently visible
		// receiver until the new interpolator is ready. This avoids a no-host gap
		// during rapid close/open retargets.
		requestedPortalHostName.set(portalHostName);
	}, [
		boundaryId,
		currentScreenKey,
		enabled,
		escapeHostKey,
		localStylesMaps,
		ownership,
		requestedPortalHostName,
		slotsMap,
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
			if (!enabled || !sourcePairKey) {
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
				handoff: false,
				pairsState: pairs.get(),
				sourcePairKey,
			});
		},
		(signal, previousSignal) => {
			"worklet";
			if (shallowEqual(previousSignal, signal)) {
				return;
			}

			scheduleOnRN(
				updatePortalOwnership,
				signal.hostScreenKey,
				signal.ownerPairKey,
				signal.ownerScreenKey ?? undefined,
			);
		},
	);

	useAnimatedReaction(
		() => {
			"worklet";
			const slot = slotsMap.get()[boundaryId];
			const teleport = slot?.props?.teleport;
			const shouldTeleport = shouldAttachBoundaryPortal({
				enabled,
				teleport,
			});
			const requestedName = requestedPortalHostName.get();
			const visibleName = visiblePortalHostName.get();
			const isInterpolatorReady = nextInterpolatorReady.get();
			const nextVisibleName = resolveNextVisiblePortalHostName({
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

			if (state.visibleName && state.visibleName === state.requestedName) {
				scheduleOnRN(dropStalePortalBoundaryHosts, {
					boundaryId,
					keepPortalHostName: state.visibleName,
				});
			}
		},
	);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			teleport,
			...slotProps
		} = slot?.props ?? {};
		const shouldTeleport = shouldAttachBoundaryPortal({
			enabled,
			teleport,
		});
		const visibleName = visiblePortalHostName.get();

		return {
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
