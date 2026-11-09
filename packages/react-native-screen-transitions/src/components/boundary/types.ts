import type { SharedValue } from "react-native-reanimated";
import type { ScreenPairKey } from "../../stores/bounds";
import type { BoundaryConfig, MeasuredBounds } from "../../types/bounds.types";

export type BoundaryId = string | number;

export type BoundaryConfigProps = BoundaryConfig;

/**
 * Boundary-specific props shared across all boundary component variants.
 * These are the props that `createBoundaryComponent` extracts and handles
 * internally, regardless of the underlying wrapped component.
 */
export interface BoundaryOwnProps extends BoundaryConfigProps {
	/**
	 * Optional group name for collection/list scenarios.
	 * When provided, concrete boundary entries use `group:id`, while transition
	 * links stay keyed by the member `id` inside the active screen pair.
	 */
	group?: string;
	/**
	 * Whether this boundary should participate in matching and measurement.
	 * @default true
	 */
	enabled?: boolean;
	/**
	 * Whether this boundary flies to its match (a boundary with the same id on the other screen)
	 * on its own. It does by default whenever the screen's interpolator returns nothing for it; turn
	 * it off to keep it still unless the interpolator styles it.
	 *
	 * @default true
	 */
	animate?: boolean;
	/**
	 * Teleports this boundary's live payload to the next matching boundary while
	 * a transition is active.
	 *
	 * @default false
	 */
	handoff?: boolean;
	/**
	 * @deprecated Boundaries escape clipping automatically when react-native-teleport is
	 * installed; this prop has no effect.
	 */
	escapeClipping?: boolean;
	id: BoundaryId;
}

/**
 * Full props for a boundary component wrapping a component with props `P`.
 * Omits `id` from the wrapped component's props (since boundary uses its own `id`).
 */
export type BoundaryComponentProps<P extends object> = Omit<P, "id"> &
	BoundaryOwnProps;

export type MeasureTarget = {
	type: "source" | "destination";
	pairKey: ScreenPairKey;
};

export type MeasureBoundary = (target: MeasureTarget) => void;

export type BoundaryLocalMeasurement = {
	bounds: MeasuredBounds;
	pairKey: ScreenPairKey;
	/**
	 * Every pair this boundary has been measured for while mounted. A boundary in the middle of a
	 * chain is measured for its incoming pair and then its outgoing one; when the outgoing one
	 * ends first, the incoming pair owns it again and it is still measured for it.
	 */
	pairKeys: Record<ScreenPairKey, true>;
};

/**
 * A boundary's entry in the shared measurement map (see utils/local-measurements): its number and
 * the map itself, so a worklet reading it depends on the map.
 */
export type BoundaryLocalMeasurementValue = {
	key: number;
	map: SharedValue<Record<number, BoundaryLocalMeasurement>>;
};
