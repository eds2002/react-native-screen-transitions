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
import { AnimationStore } from "../../../../stores/animation.store";
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
	const { slotsMap } = useScreenSlots();
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);

	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);

	const [attachment, setAttachment] = useState<PortalAttachment | null>(
		PORTAL_HOST_NAME_RESET_VALUE,
	);
	const attachedHostName = useSharedValue<string | null>(
		PORTAL_HOST_NAME_RESET_VALUE,
	);
	const placeholderWidth = useSharedValue(0);
	const placeholderHeight = useSharedValue(0);

	const { progressScreenKey, targetScreenKey } = resolvePortalAttachmentTargets(
		{
			attachment,
			currentScreenKey,
			nextScreenKey,
			portalAttachTarget,
			sourcePairKey,
		},
	);
	const activeHostKey = useActiveHostKey(targetScreenKey);
	const activeHostCapturesScroll = activeHostKey
		? getHostCapturesScroll(activeHostKey)
		: false;
	const progress = AnimationStore.getValue(
		progressScreenKey ?? "",
		"transitionProgress",
	);
	const closing = AnimationStore.getValue(progressScreenKey ?? "", "closing");

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
			attachedHostName.set(PORTAL_HOST_NAME_RESET_VALUE);
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
	}, [
		activeHostKey,
		activeHostCapturesScroll,
		attachedHostName,
		attachment,
		id,
		isPortalEnabled,
		targetScreenKey,
	]);

	useLayoutEffect(() => {
		return () => {
			attachedHostName.set(PORTAL_HOST_NAME_RESET_VALUE);
			unmountPortalBoundaryHost(id);
		};
	}, [attachedHostName, id]);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!isPortalEnabled || !sourcePairKey) {
				return null;
			}

			pairs.get();
			// Strict per-member lookup: getResolvedLink's group fallback borrows
			// the initial member's link for style resolution, which would make
			// every inactive group member's portal see a "complete" link and
			// attach. A portal may only teleport on its OWN member's link.
			const link = getLink(sourcePairKey, id);

			if (link?.status !== "complete") {
				return null;
			}

			// Grouped portals teleport only while their member is the group's
			// active id — retargeting detaches the previous member (its content
			// returns home) and attaches the new one. Exactly one grouped member
			// is teleported at a time.
			if (link.group) {
				const activeId =
					pairs.get()[sourcePairKey]?.groups?.[link.group]?.activeId;

				if (activeId && activeId !== getLinkKeyFromTag(id)) {
					return null;
				}
			}

			return link.destination.screenKey;
		},
		(matchedScreenKey, previousMatchedScreenKey) => {
			"worklet";
			if (matchedScreenKey === previousMatchedScreenKey) {
				return;
			}

			runOnJS(updatePortalAttachment)(matchedScreenKey, sourcePairKey);
		},
	);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		// Opening waits for the destination transition to start so content is not
		// re-parented before the host is visually ready. Closing stays attached
		// through progress 0 so the final frame can land in the matched host.
		const attachThreshold = closing.get() === 1 ? 0 : 0.001;
		const { teleport, ...slotProps } = slotsMap.get()[id]?.props ?? {};
		const shouldTeleport = isTeleportEnabled(teleport);

		return {
			// Preserve portal slot props from the interpolator while keeping
			// hostName owned by the attachment gate below.
			...slotProps,
			hostName:
				shouldTeleport && progress.get() >= attachThreshold
					? attachedHostName.get()
					: PORTAL_HOST_NAME_RESET_VALUE,
		};
	});

	// Pin the placeholder to its measured size while content lives in the host,
	// in the same UI frame the host name flips — no commit in between. Until the
	// first layout lands (dims 0) sizing stays natural so an instant attach
	// cannot collapse the slot.
	const placeholderStyle = useAnimatedStyle(() => {
		"worklet";
		const hostName = attachedHostName.get();
		const isAttached = hostName !== null;
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
