import type { ScreenPairKey } from "../../stores/bounds/types";
import type { BoundsOptions } from "../../utils/bounds/types/options";

export type BoundaryId = string | number;

export type BoundaryConfigProps = Pick<
	BoundsOptions,
	"anchor" | "scaleMode" | "target" | "method"
>;

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
	 * Renders this boundary target through a layout-preserving portal when the
	 * `react-native-teleport` integration is installed.
	 *
	 * The target keeps its measured layout space in the original tree, while the
	 * rendered element is attached to the boundary portal host. Interpolators can
	 * then update the portal host/style ids to move that rendered element outside
	 * of its original clipping or layout constraints during a transition.
	 *
	 * @default false
	 */
	portal?: boolean;
	id: BoundaryId;
}

/**
 * Full props for a boundary component wrapping a component with props `P`.
 * Omits `id` from the wrapped component's props (since boundary uses its own `id`).
 */
export type BoundaryComponentProps<P extends object> = Omit<P, "id"> &
	BoundaryOwnProps;

export type MeasureTarget =
	| {
			type: "source";
			pairKey: ScreenPairKey;
	  }
	| {
			type: "destination";
			pairKey: ScreenPairKey;
	  };

export type MeasureBoundary = (target: MeasureTarget) => void;
