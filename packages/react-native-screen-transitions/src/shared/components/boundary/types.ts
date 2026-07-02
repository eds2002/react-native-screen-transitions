import type { ScreenPairKey } from "../../stores/bounds/types";
import type { BoundsOptions } from "../../utils/bounds/types/options";

export type BoundaryId = string | number;

export type BoundaryPortal = boolean | "boundary-local" | "screen";

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
	 * Teleports this boundary's live payload to the next matching boundary while
	 * a transition is active.
	 *
	 * @default false
	 */
	handoff?: boolean;
	/**
	 * Renders this boundary through the current screen's portal host while a
	 * transition is active so the payload can escape clipping/layout constraints.
	 *
	 * @default false
	 */
	escapeClipping?: boolean;
	/**
	 * @deprecated Use `handoff` and `escapeClipping`.
	 *
	 * @default false
	 */
	portal?: BoundaryPortal;
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
