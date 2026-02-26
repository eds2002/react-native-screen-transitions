import type { ViewProps } from "react-native";
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
	 * When provided, boundaries are tracked as a group and the active member
	 * re-measures automatically when focus changes within the group.
	 * The internal tag becomes `group:id`.
	 */
	group?: string;
	/**
	 * Whether this boundary should participate in matching and measurement.
	 * @default true
	 */
	enabled?: boolean;
	id: BoundaryId;
}

/**
 * Full props for a boundary component wrapping a component with props `P`.
 * Omits `id` from the wrapped component's props (since boundary uses its own `id`).
 */
export type BoundaryComponentProps<P extends object> = Omit<P, "id"> &
	BoundaryOwnProps;

/** Convenience alias for a View-based boundary (the most common case). */
export type BoundaryProps = BoundaryComponentProps<ViewProps>;

export interface MaybeMeasureAndStoreParams {
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
	shouldUpdateSource?: boolean;
	shouldUpdateDestination?: boolean;
}
