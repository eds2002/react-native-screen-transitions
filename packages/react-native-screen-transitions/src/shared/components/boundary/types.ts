import type { ScreenPairKey } from "../../stores/bounds/types";
import type { BoundsOptions } from "../../utils/bounds/types/options";

export type BoundaryId = string | number;

/**
 * Selects the screen host that should receive an automatically attached portal.
 */
export type BoundaryPortalHost = "current-screen" | "paired-screen";

/**
 * Configures automatic portal attachment for a boundary target.
 */
export type BoundaryPortalOptions = {
	/**
	 * `current-screen` keeps the portal on this boundary's screen. `paired-screen`
	 * moves it to the adjacent screen once the source/destination link completes.
	 */
	host: BoundaryPortalHost;
};

export type BoundaryPortal = boolean | BoundaryPortalOptions;

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
	 * Renders this boundary target through a layout-preserving portal when
	 * `react-native-teleport` is installed.
	 *
	 * The target keeps its measured layout space in the original tree. Once the
	 * active source/destination link for this boundary is complete, the screen
	 * portal layer can render a boundary-specific host and attach this target to
	 * it so the active matched target escapes local clipping.
	 *
	 * Use `true` to attach to the current screen host. Use
	 * `{ host: "paired-screen" }` to attach to the adjacent linked screen host.
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
