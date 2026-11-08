import {
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
	useSyncExternalStore,
} from "react";
import {
	type SharedValue,
	useAnimatedProps,
	useAnimatedReaction,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { screenTopology } from "../../../../providers/builder/topology";
import type { BoundaryPresentationValue } from "../../presentation/use-boundary-presentation";
import { useBoundaryRootStore } from "../../root/boundary-root.provider";
import type { BoundaryLocalMeasurementValue } from "../../types";
import { setHandoffLending } from "../stores/handoff-lenders.store";
import { isBoundaryEscaped } from "../utils/is-escaped";
import {
	createHandoffHostName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";
import { useActivePortalBoundaryHost } from "./use-active-portal-boundary-host";

export type PortalMode = "handoff" | "escapeClipping";

type TeleportProps = ReturnType<typeof useAnimatedProps>;

export function usePortalDestination(boundaryId: string, mode: PortalMode) {
	const {
		currentScreenKey,
		escapeMeasured,
		localMeasurement,
		portalHostReady,
		slotsMap,
		boundaryPresentation,
	} = useBoundaryRootStore((s) => s);
	// Every boundary can escape, but only one taking part in a transition needs a host in the
	// overlay: it registers the first time the boundary is measured for a pair (a source on press, a
	// destination on mount), not on mount. A long list of boundaries costs the overlay nothing.
	const escapeHostKey =
		mode === "escapeClipping" && escapeMeasured ? currentScreenKey : undefined;
	const portalHostName = useActivePortalBoundaryHost({
		boundaryId,
		escapeHostKey,
		localMeasurement,
		portalHostReady,
		slotsMap,
	});
	// The teleport's animated props (which host the content is in) run on the UI thread, so a
	// boundary only gets them once it can leave: a handoff boundary from mount, an escaping one once
	// it is measured for a transition. Until then it renders inline, as a plain portal. Once started
	// they stay (they return the portal inline when the boundary goes back to rest), so the native
	// view never keeps a host name nothing updates.
	const [teleportProps, setTeleportProps] = useState<TeleportProps | null>(
		null,
	);
	const [started, setStarted] = useState(false);
	if (!started && (mode === "handoff" || escapeMeasured)) setStarted(true);
	return {
		pinned: escapeMeasured,
		teleportProps: teleportProps ?? undefined,
		teleportDriver: started ? (
			<TeleportPropsDriver
				boundaryId={boundaryId}
				currentScreenKey={currentScreenKey}
				localMeasurement={localMeasurement}
				mode={mode}
				onChange={setTeleportProps}
				portalHostName={portalHostName}
				portalHostReady={portalHostReady}
				presentation={boundaryPresentation}
			/>
		) : null,
		localHostName: createHandoffHostName(currentScreenKey, boundaryId),
	};
}

let nextLenderId = 0;

/**
 * While a handoff boundary's content is presented in another screen, marks its screen (and the
 * screens it is nested in) as lending it, so the navigator does not hide or pause them.
 */
function useHandoffLending(
	enabled: boolean,
	currentScreenKey: string,
	presentation: SharedValue<BoundaryPresentationValue>,
) {
	const lenderKey = useMemo(() => String(++nextLenderId), []);
	// The screen's parent is registered after it mounts (and can change): follow it, or the screens it
	// is nested in would not be marked, and the navigator above would hide them with the content.
	const parentScreenKey = useSyncExternalStore(
		useCallback(
			(listener: () => void) =>
				screenTopology.subscribe(currentScreenKey, listener),
			[currentScreenKey],
		),
		() => screenTopology.getRelationships(currentScreenKey).parentScreenKey,
	);
	const screenKeys = useMemo(() => {
		const out = [currentScreenKey];
		let key = parentScreenKey;
		while (key && !out.includes(key)) {
			out.push(key);
			key = screenTopology.getRelationships(key).parentScreenKey;
		}
		return out;
	}, [currentScreenKey, parentScreenKey]);
	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return false;
			const receiver = presentation.get().receiver;
			return !!receiver && receiver !== currentScreenKey;
		},
		(lending, previous) => {
			"worklet";
			if (lending === previous) return;
			setHandoffLending(screenKeys, lenderKey, lending);
		},
	);
	useEffect(
		() => () => scheduleOnUI(setHandoffLending, screenKeys, lenderKey, false),
		[screenKeys, lenderKey],
	);
}

const TeleportPropsDriver = memo(function TeleportPropsDriver({
	boundaryId,
	currentScreenKey,
	localMeasurement,
	mode,
	onChange,
	portalHostName,
	portalHostReady,
	presentation,
}: {
	boundaryId: string;
	currentScreenKey: string;
	localMeasurement: BoundaryLocalMeasurementValue;
	mode: PortalMode;
	onChange: (props: TeleportProps | null) => void;
	portalHostName: string | null;
	portalHostReady: SharedValue<boolean>;
	presentation: SharedValue<BoundaryPresentationValue>;
}) {
	useHandoffLending(mode === "handoff", currentScreenKey, presentation);
	const teleportProps = useAnimatedProps(() => {
		"worklet";
		const { receiver, slots } = presentation.get();
		const slot = slots[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			handoffTarget: _handoffTarget,
			...props
		} = slot?.props ?? {};
		let hostName: string | null = PORTAL_HOST_NAME_RESET_VALUE;
		if (mode === "handoff") {
			// At home the content stays in place (no host): moved into a host, even its own, it would be
			// laid out at that host's last known size for a frame.
			if (receiver && receiver !== currentScreenKey)
				hostName = createHandoffHostName(receiver, boundaryId);
		} else if (
			isBoundaryEscaped({
				boundaryId,
				presentation,
				localMeasurement,
				portalHostReady,
			})
		) {
			hostName = portalHostName;
		}

		return { ...props, hostName };
	});
	useLayoutEffect(() => {
		onChange(teleportProps);
	}, [teleportProps, onChange]);
	return null;
});
