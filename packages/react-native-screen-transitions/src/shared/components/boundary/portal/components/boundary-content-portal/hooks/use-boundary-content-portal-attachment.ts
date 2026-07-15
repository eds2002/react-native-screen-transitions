import { useCallback, useLayoutEffect, useState } from "react";
import {
	runOnJS,
	useAnimatedProps,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../../../providers/screen/styles";
import { useRegisteredScreenSlots } from "../../../../../../providers/screen/styles/stores/slot-references.store";
import { AnimationStore } from "../../../../../../stores/animation.store";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import {
	canSwitchHandoffHostImmediately,
	isHandoffHostClosingComplete,
	type PortalOwnershipSignal,
	resolveBoundaryPortalOwnership,
} from "../../../utils/ownership";
import { shallowEqual } from "../../../utils/shallow-equal";
import { shouldAttachBoundaryPortal } from "../../../utils/teleport-control";
import { resolveNextVisiblePortalHostName } from "../../../utils/visible-host";
import { createBoundaryContentPortalHostName } from "../helpers/host-name";

interface UseBoundaryContentPortalAttachmentParams {
	boundaryId: string;
	enabled: boolean;
}

export const useBoundaryContentPortalAttachment = ({
	boundaryId,
	enabled,
}: UseBoundaryContentPortalAttachmentParams) => {
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
		nextInterpolatorReady: activeNextInterpolatorReady,
		slotsMap: activeSlotsMap,
	} = activeScreenSlots;
	const requestedPortalHostName = useSharedValue<string | null>(null);
	const visiblePortalHostName = useSharedValue<string | null>(null);
	const canSwitchPortalHostImmediately = useSharedValue(0);

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
	const settledHostWillAnimate = AnimationStore.getValue(
		settledHostScreenKey ?? currentScreenKey,
		"willAnimate",
	);
	const settledHostClosing = AnimationStore.getValue(
		settledHostScreenKey ?? currentScreenKey,
		"closing",
	);
	const handoffHostName =
		targetScreenKey !== null
			? createBoundaryContentPortalHostName(targetScreenKey, boundaryId)
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
		if (!enabled || !ownership || !handoffHostName) {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
			return;
		}

		requestedPortalHostName.set(handoffHostName);
	}, [
		enabled,
		handoffHostName,
		ownership,
		requestedPortalHostName,
		visiblePortalHostName,
	]);

	useLayoutEffect(() => {
		return () => {
			requestedPortalHostName.set(null);
			visiblePortalHostName.set(null);
		};
	}, [requestedPortalHostName, visiblePortalHostName]);

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

			const progressAnimating = settledHostAnimating.get();
			const progressSettled = settledHostProgress.get();
			const willAnimate = settledHostWillAnimate.get();

			return resolveBoundaryPortalOwnership({
				boundaryId,
				currentScreenKey,
				handoff: true,
				isSettledHostClosingComplete: isHandoffHostClosingComplete({
					closing: settledHostClosing.get(),
					progressAnimating,
					progressSettled,
					willAnimate,
				}),
				isSettledHostReady: progressSettled === 1 && progressAnimating === 0,
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

			if (signal.status === "pending") {
				canSwitchPortalHostImmediately.set(0);
				return;
			}

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
				const hostName = createBoundaryContentPortalHostName(
					hostScreenKey,
					boundaryId,
				);
				requestedPortalHostName.set(hostName);
				visiblePortalHostName.set(hostName);
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
				enabled,
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
			}
		},
	);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = activeSlotsMap.get()[boundaryId];
		const { teleport, ...slotProps } = slot?.props ?? {};
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
