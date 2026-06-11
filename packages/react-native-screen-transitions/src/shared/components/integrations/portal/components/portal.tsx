import {
	memo,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useState,
} from "react";
import { View } from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { Portal as NativePortal } from "react-native-teleport";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { getResolvedLink } from "../../../../stores/bounds/internals/links";
import { pairs } from "../../../../stores/bounds/internals/state";
import type { BoundaryPortal } from "../../../boundary/types";
import { createTransitionAwareComponent } from "../../../create-transition-aware-component";
import { usePlaceholderLayout } from "../hooks/use-placeholder-layout";
import {
	getHostCapturesScroll,
	useActiveHostKey,
} from "../stores/host-registry.store";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHost,
} from "../stores/portal-boundary-host.store";
import { createPortalBoundaryHostName, createPortalName } from "../utils";

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

const getPortalHostMode = (mode?: BoundaryPortal): PortalHostMode => {
	if (!mode || mode === true) {
		return "current-screen";
	}

	return mode.host;
};

export const Portal = memo(function Portal({
	id = "my-id",
	children,
	mode = false,
}: PortalProps) {
	const styleId = createPortalName(id);
	const isPortalEnabled = !!mode;

	const portalHostMode = getPortalHostMode(mode);
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);

	const [attachment, setAttachment] = useState<PortalAttachment | null>(null);
	const [attachedHostName, setAttachedHostName] = useState<
		string | undefined
	>();
	const [isAttached, setIsAttached] = useState(false);

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
			setAttachedHostName(undefined);
			setIsAttached(false);
			unmountPortalBoundaryHost(id);
			return;
		}

		const hostName = createPortalBoundaryHostName(activeHostKey, id);

		setAttachedHostName(undefined);
		setIsAttached(false);
		mountPortalBoundaryHost({
			boundaryId: id,
			capturesScroll: activeHostCapturesScroll,
			hostKey: activeHostKey,
			pairKey: attachment.pairKey,
			screenKey: targetScreenKey,
		});

		// NOTE:
		// Right now, this is not my favorite implementation. If we're teleporting to A paired screen,
		// we'll need a slight buffer to ensure react renders and applies our transformation properly to the
		// host.
		//
		// One proposed shape is changing the blocking system to have a reason for blocking.
		//
		// For example, blocking is mostly used in bounds, bounds should specificy why theyre blocking.
		//
		// Could be these:
		// awaiting-measurement <-- for initial boundary mount
		// invalid-measurement (e.g. offset measurements) < -- this would then apply the offset we have inside useMaybeBlockVisibility
		// NEW: paired-screen-buffer <-- for paired screen teleportation
		//
		//
		// If we could extend that, then we necessarily wouldn't need this dynamic buffer count we have.
		const rafCount = portalHostMode === "paired-screen" ? 3 : 2;
		let isCancelled = false;
		const attachAfterRafs = (remainingRafs: number) => {
			if (isCancelled) {
				return;
			}

			if (remainingRafs <= 0) {
				setAttachedHostName(hostName);
				setIsAttached(true);
				return;
			}

			requestAnimationFrame(() => attachAfterRafs(remainingRafs - 1));
		};

		attachAfterRafs(rafCount);

		return () => {
			isCancelled = true;
			unmountPortalBoundaryHost(id);
		};
	}, [
		activeHostKey,
		activeHostCapturesScroll,
		attachment,
		id,
		isPortalEnabled,
		portalHostMode,
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
			if (!link?.source || !link.destination) {
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

	const { placeholderStyle, handleLayout } = usePlaceholderLayout();

	if (isPortalEnabled) {
		return (
			<View
				onLayout={handleLayout}
				style={isAttached ? placeholderStyle : undefined}
			>
				<TransitionAwareTeleport
					hostName={isAttached ? attachedHostName : undefined} // <-- this can be handled in animated props
					name={styleId} //<-- this can be handled in animated props
				>
					{children}
				</TransitionAwareTeleport>
			</View>
		);
	}

	return children;
});
