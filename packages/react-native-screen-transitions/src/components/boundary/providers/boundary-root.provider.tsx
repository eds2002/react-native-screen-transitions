import {
	type ForwardedRef,
	type ReactNode,
	useCallback,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import type { View } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import { useAnimatedRef } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import {
	useComposedSlotStyles,
	useSlotStackingStyles,
} from "../../../providers/screen/styles";
import { createBoundTag } from "../../../stores/bounds/helpers/link-pairs.helpers";
import type { BoundTag } from "../../../stores/bounds/types";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";
import { useBoundaryMeasurement } from "../hooks/use-boundary-measurement";
import {
	type BoundaryPortalRuntime,
	resolveBoundaryPortal,
} from "../portal/utils/resolve-portal";
import type {
	BoundaryConfigProps,
	BoundaryId,
	BoundaryOwnProps,
} from "../types";

interface BoundaryRootContextValue extends BoundaryRootRenderState {
	registerTargetRef: (
		targetRef: AnimatedRef<View>,
		preparedStyles: StyleProps,
		measurementRef?: AnimatedRef<View>,
	) => void;
	unregisterTargetRef: (targetRef: AnimatedRef<View>) => void;
	activeTargetRef: AnimatedRef<View> | null;
	boundTag: BoundTag;
	portalRuntime: BoundaryPortalRuntime;
}

type BoundaryTargetEntry = {
	ref: AnimatedRef<View>;
	/** Surface to measure — the portal placeholder when content can teleport. */
	measurementRef: AnimatedRef<View>;
	preparedStyles: StyleProps;
};

// logger.warn prepends the library prefix.
const MULTIPLE_TARGETS_WARNING =
	"Multiple Boundary.Target elements were rendered under the same boundary root. The first registered target will be measured.";

export const TARGET_OUTSIDE_ROOT_WARNING =
	"Boundary.Target must be rendered inside Transition.Boundary or a component created by createBoundaryComponent.";

export type BoundaryRootRenderState = {
	attachedStyle: unknown;
	boundTag: BoundTag;
	currentScreenKey: string;
	handoffEnabled: boolean;
	portalRuntime: BoundaryPortalRuntime;
	ref: AnimatedRef<View>;
	rootEscapePlaceholderRef: AnimatedRef<View>;
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
	id: BoundaryId;
	style?: unknown;
};

export const {
	BoundaryRootProvider,
	useBoundaryRootContext,
	useBoundaryRootStore,
} = createProvider("BoundaryRoot", { guarded: false })<
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
		id,
		style,
	}) => {
		const requestedBoundTag = useMemo(
			() => createBoundTag(String(id), group),
			[id, group],
		);
		const portalRuntime = resolveBoundaryPortal({
			handoff,
			escapeClipping,
		});

		const currentScreenKey = useDescriptorsStore(
			(s) => s.derivations.currentScreenKey,
		);
		const currentActivity = useDescriptorsStore(
			(s) => s.descriptors.current.activity,
		);
		const retainedBoundTagRef = useRef(requestedBoundTag);
		const shouldRetainClosingBoundTag =
			portalRuntime.handoff && currentActivity === "closing";

		// Navigation can update a retained closing route's params before that
		// route leaves the stack. Keep its handoff identity stable so the payload
		// remains attached to the closing destination instead of being orphaned.
		if (!shouldRetainClosingBoundTag) {
			retainedBoundTagRef.current = requestedBoundTag;
		}

		const boundTag = retainedBoundTagRef.current;
		const hasConfiguredInterpolator = useDescriptorsStore(
			(s) => s.derivations.hasConfiguredInterpolator,
		);
		const runtimeEnabled = enabled && hasConfiguredInterpolator;
		// Associated slot styles attach whenever the boundary is enabled,
		// independent of whether an interpolator is configured for this transition.
		const shouldAttachAssociatedStyles = enabled;
		const shouldEscapeBoundaryRootToScreenHost = portalRuntime.escapeClipping;

		const associatedStyles = useComposedSlotStyles(boundTag.tag, style);
		const associatedStackingStyles = useSlotStackingStyles(boundTag.tag);
		const rootRef = useAnimatedRef<View>();
		const rootEscapePlaceholderRef = useAnimatedRef<View>();
		const [targetEntry, setTargetEntry] = useState<BoundaryTargetEntry | null>(
			null,
		);

		const registerTargetRef = useCallback(
			(
				targetRef: AnimatedRef<View>,
				preparedStyles: StyleProps,
				measurementRef?: AnimatedRef<View>,
			) => {
				setTargetEntry((prev) => {
					if (prev?.ref === targetRef) {
						return prev;
					}

					if (__DEV__ && prev !== null) {
						logger.warnOnce(
							"boundary:multiple-targets",
							MULTIPLE_TARGETS_WARNING,
						);
					}

					return (
						prev ?? {
							ref: targetRef,
							measurementRef: measurementRef ?? targetRef,
							preparedStyles,
						}
					);
				});
			},
			[],
		);

		const unregisterTargetRef = useCallback((targetRef: AnimatedRef<View>) => {
			setTargetEntry((prev) => (prev?.ref === targetRef ? null : prev));
		}, []);

		const rootMeasurementRef = shouldEscapeBoundaryRootToScreenHost
			? rootEscapePlaceholderRef
			: rootRef;
		const measuredRef = targetEntry?.measurementRef ?? rootMeasurementRef;
		const hasActiveTarget = targetEntry !== null;
		const targetPreparedStyles = targetEntry?.preparedStyles;

		useImperativeHandle(forwardedRef, () => rootRef.current as any, [rootRef]);

		useBoundaryMeasurement({
			boundTag,
			enabled,
			runtimeEnabled,
			currentScreenKey,
			measuredRef,
			style,
			targetPreparedStyles,
			handoff: portalRuntime.handoff,
			escapeClipping: portalRuntime.escapeClipping,
			config,
		});

		const shouldRenderBoundaryRootThroughPortal =
			shouldEscapeBoundaryRootToScreenHost && !hasActiveTarget;
		const handoffEnabled = enabled && portalRuntime.handoff;
		// A nested active target takes the full associated style, so the root keeps
		// only its stacking context. Root-owned escape-clipping moves the root
		// through a screen host, so its associated style is applied through the
		// host instead of inline on the escaped element.
		// Host-only handoff receivers still need the associated style: their
		// handoff host is absolute-filled inside this root, so the root is the
		// visual frame that animates the received payload.
		const attachedStyle = shouldAttachAssociatedStyles
			? hasActiveTarget
				? associatedStackingStyles
				: shouldRenderBoundaryRootThroughPortal
					? undefined
					: associatedStyles
			: undefined;

		const value = useMemo<BoundaryRootContextValue>(
			() => ({
				attachedStyle,
				activeTargetRef: targetEntry?.ref ?? null,
				boundTag,
				currentScreenKey,
				handoffEnabled,
				portalRuntime,
				registerTargetRef,
				ref: rootRef,
				rootEscapePlaceholderRef,
				shouldRenderBoundaryRootThroughPortal,
				shouldRenderHandoffHost: handoffEnabled && !hasActiveTarget,
				unregisterTargetRef,
			}),
			[
				attachedStyle,
				boundTag,
				currentScreenKey,
				handoffEnabled,
				hasActiveTarget,
				portalRuntime,
				registerTargetRef,
				rootRef,
				rootEscapePlaceholderRef,
				shouldRenderBoundaryRootThroughPortal,
				targetEntry,
				unregisterTargetRef,
			],
		);

		return {
			value,
			children: children(value),
		};
	},
);
