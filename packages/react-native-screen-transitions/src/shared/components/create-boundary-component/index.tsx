import { Pressable, View } from "react-native";
import { BoundaryTarget } from "./components/boundary-target";
import { createBoundaryComponent } from "./create-boundary-component";

export { createBoundaryComponent };

const BoundaryView = createBoundaryComponent(View);
const BoundaryTrigger = createBoundaryComponent(Pressable);
BoundaryView.displayName = "Transition.Boundary.View";
BoundaryTrigger.displayName = "Transition.Boundary.Trigger";
BoundaryTarget.displayName = "Transition.Boundary.Target";

/**
 * Shared-boundary components.
 *
 * How measurement works:
 * 1. Source screen captures bounds for a tag.
 * 2. Destination screen captures bounds for the same tag.
 * 3. The link is updated as layout changes (group-active + scroll-settled paths).
 *
 * Trigger behavior:
 * - When a boundary has `onPress` (typically `Boundary.Trigger`), source
 *   measurement runs before the user callback. This gives navigation transitions
 *   fresh source geometry on the first frame.
 *
 * Use:
 * - `Boundary.View` for passive/shared elements.
 * - `Boundary.Trigger` for tappable elements that start navigation.
 * - `Boundary.Target` to measure a nested descendant instead of the owner.
 */
export const Boundary = {
	/** Passive boundary wrapper (no built-in press semantics). */
	View: BoundaryView,
	/** Pressable boundary wrapper with press-priority source capture. */
	Trigger: BoundaryTrigger,
	/** Optional nested measurement override inside a boundary owner. */
	Target: BoundaryTarget,
};
