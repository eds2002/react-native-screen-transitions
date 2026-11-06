import {
	type ForwardedRef,
	type ReactNode,
	useCallback,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import {
	type SharedValue,
	useAnimatedRef,
	useSharedValue,
} from "react-native-reanimated";
import { useBuilderStore } from "../../../providers/builder";
import { useOptionalScreenHostStore } from "../../../providers/host/screen-host.provider";
import { createBoundTag } from "../../../stores/bounds/helpers/link-pairs.helpers";
import type { BoundTag } from "../../../stores/bounds/types";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";
import { BoundaryLifecycle } from "../components/boundary-lifecycle";
import { useBoundaryPresentation } from "../hooks/use-boundary-presentation";
import { useComposedBoundaryStyle } from "../hooks/use-composed-boundary-style";
import { resolveBoundaryPortal } from "../portal/utils/resolve-portal";
import type {
	BoundaryConfigProps,
	BoundaryId,
	BoundaryLocalMeasurement,
	BoundaryLocalMeasurementValue,
	BoundaryOwnProps,
} from "../types";

type BoundaryRootContextValue = BoundaryRootRenderState;

// logger.warn prepends the library prefix.
const MULTIPLE_TARGETS_WARNING =
	"Multiple Boundary.Target elements were rendered under the same boundary root. The first target in render order will be measured.";

export const TARGET_OUTSIDE_ROOT_WARNING =
	"Boundary.Target must be rendered inside Transition.Boundary or a component created by createBoundaryComponent.";

export type BoundaryRootRenderState = {
	boundaryPresentation: ReturnType<
		typeof useBoundaryPresentation
	>["presentation"];
	slotsMap: ReturnType<typeof useBoundaryPresentation>["slotsMap"];
	attachedStyle: unknown;
	boundTag: BoundTag;
	currentScreenKey: string;
	/** This boundary has been measured for a transition, so it has (or is getting) an overlay host. */
	escapeMeasured: boolean;
	handoffEnabled: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
	measurementRef: AnimatedRef<View>;
	portalRuntime: ReturnType<typeof resolveBoundaryPortal>;
	ref: AnimatedRef<View>;
	/** Set by the overlay once this boundary's host is placed. */
	portalHostReady: SharedValue<boolean>;
	shouldRenderBoundaryRootThroughPortal: boolean;
	shouldRenderHandoffHost: boolean;
};

type BoundaryRootProviderProps = Pick<
	BoundaryOwnProps,
	"enabled" | "escapeClipping" | "group" | "handoff"
> & {
	children: (state: BoundaryRootRenderState) => ReactNode;
	config: BoundaryConfigProps;
	forwardedRef?: ForwardedRef<any>;
	hasTarget: boolean;
	id: BoundaryId;
	style?: unknown;
	targetCount: number;
	targetStyle?: unknown;
};

export const {
	BoundaryRootProvider,
	useBoundaryRootStore,
	useOptionalBoundaryRootStore,
} = createProvider("BoundaryRoot")<
	BoundaryRootProviderProps,
	BoundaryRootContextValue
>(
	({
		children,
		config,
		enabled = true,
		escapeClipping,
		forwardedRef,
		group,
		handoff,
		hasTarget,
		id,
		style,
		targetCount,
		targetStyle,
	}) => {
		const requestedBoundTag = useMemo(
			() => createBoundTag(String(id), group),
			[id, group],
		);
		const portalRuntime = useMemo(
			() => resolveBoundaryPortal({ handoff, escapeClipping }),
			[handoff, escapeClipping],
		);

		const currentScreenKey = useBuilderStore(
			(s) => s.derivations.currentScreenKey,
		);
		const isCurrentScreenClosing = useOptionalScreenHostStore(
			(store) =>
				portalRuntime.handoff &&
				store?.scenesByKey[currentScreenKey]?.activity === "closing",
		);
		const retainedBoundTagRef = useRef(requestedBoundTag);
		const shouldRetainClosingBoundTag =
			portalRuntime.handoff && isCurrentScreenClosing;

		// Navigation can update a retained closing route's params before that
		// route leaves the stack. Keep its handoff identity stable so the payload
		// remains attached to the closing destination instead of being orphaned.
		if (!shouldRetainClosingBoundTag) {
			retainedBoundTagRef.current = requestedBoundTag;
		}

		const boundTag = retainedBoundTagRef.current;
		// Associated slot styles attach whenever the boundary is enabled,
		// independent of whether an interpolator is configured for this transition.
		const shouldAttachAssociatedStyles = enabled;
		const shouldEscapeBoundaryRootToScreenHost = portalRuntime.escapeClipping;

		const localMeasurement = useSharedValue<BoundaryLocalMeasurement | null>(
			null,
		);
		const portalHostReady = useSharedValue(false);
		const [escapeMeasured, setEscapeMeasured] = useState(false);
		const onFirstEscapeMeasure = useCallback(() => setEscapeMeasured(true), []);

		// Following pair presentations costs UI work on every bounds change and every transition
		// frame: only boundaries taking part in a transition (handoff, or escaping and measured for a
		// pair) do it. The rest only read their own screen's slots.
		const { presentation: boundaryPresentation, slotsMap } =
			useBoundaryPresentation(
				boundTag.tag,
				enabled &&
					(portalRuntime.handoff ||
						(portalRuntime.escapeClipping && escapeMeasured)),
			);

		const associatedStyles = useComposedBoundaryStyle(
			slotsMap,
			boundTag.tag,
			style,
			hasTarget ? "stacking" : "full",
			shouldEscapeBoundaryRootToScreenHost && !hasTarget
				? {
						boundaryId: boundTag.tag,
						presentation: boundaryPresentation,
						localMeasurement,
						portalHostReady,
					}
				: undefined,
		);

		const rootRef = useAnimatedRef<View>();
		const measurementRef = useAnimatedRef<View>();

		useLayoutEffect(() => {
			if (__DEV__ && targetCount > 1) {
				logger.warnOnce("boundary:multiple-targets", MULTIPLE_TARGETS_WARNING);
			}
		}, [targetCount]);

		const measuredRef =
			hasTarget || shouldEscapeBoundaryRootToScreenHost
				? measurementRef
				: rootRef;

		useImperativeHandle(forwardedRef, () => rootRef.current as any, [rootRef]);

		const shouldRenderBoundaryRootThroughPortal =
			shouldEscapeBoundaryRootToScreenHost && !hasTarget;
		const handoffEnabled = enabled && portalRuntime.handoff;
		// A nested active target takes the full associated style, so the root keeps
		// only its stacking context. Root-owned escape-clipping moves the root
		// through a screen host, so transforms apply through the host while layout dimensions
		// also apply to the escaped element.
		// Host-only handoff receivers still need the associated style: their
		// handoff host is absolute-filled inside this root, so the root is the
		// visual frame that animates the received payload.
		const attachedStyle = shouldAttachAssociatedStyles
			? associatedStyles
			: undefined;

		const value = useMemo<BoundaryRootContextValue>(
			() => ({
				boundaryPresentation,
				slotsMap,
				attachedStyle,
				boundTag,
				currentScreenKey,
				escapeMeasured,
				handoffEnabled,
				localMeasurement,
				measurementRef,
				portalRuntime,
				portalHostReady,
				ref: rootRef,
				shouldRenderBoundaryRootThroughPortal,
				shouldRenderHandoffHost: handoffEnabled && !hasTarget,
			}),
			[
				boundaryPresentation,
				slotsMap,
				attachedStyle,
				boundTag,
				currentScreenKey,
				escapeMeasured,
				handoffEnabled,
				hasTarget,
				localMeasurement,
				measurementRef,
				portalRuntime,
				portalHostReady,
				rootRef,
				shouldRenderBoundaryRootThroughPortal,
			],
		);

		return {
			value,
			children: (
				<>
					{children(value)}
					<BoundaryLifecycle
						boundTag={boundTag}
						config={config}
						currentScreenKey={currentScreenKey}
						enabled={enabled}
						escapeClipping={portalRuntime.escapeClipping}
						handoff={portalRuntime.handoff}
						localMeasurement={localMeasurement}
						measuredRef={measuredRef}
						onFirstEscapeMeasure={onFirstEscapeMeasure}
						style={hasTarget ? targetStyle : style}
					/>
				</>
			),
		};
	},
);
