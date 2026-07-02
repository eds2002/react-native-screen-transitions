import { forwardRef } from "react";
import {
	Pressable,
	type PressableProps,
	View,
	type ViewProps,
} from "react-native";
import { BoundaryTarget } from "./components/boundary-target";
import { createBoundaryComponent } from "./create-boundary-component";
import { Host } from "./portal";
import type { BoundaryComponentProps } from "./types";

export { createBoundaryComponent };

type BoundaryPrimitiveProps = Omit<ViewProps, "id" | "style"> &
	Omit<PressableProps, "id" | "style"> & {
		style?: ViewProps["style"] | PressableProps["style"];
	};

const BoundaryPrimitive = forwardRef<View, BoundaryPrimitiveProps>(
	(props, ref) => {
		const Component = "onPress" in props ? Pressable : View;

		return <Component {...(props as any)} ref={ref as any} />;
	},
);

BoundaryPrimitive.displayName = "Transition.Boundary.Primitive";

const BoundaryRoot = createBoundaryComponent(BoundaryPrimitive);
const BoundaryView = createBoundaryComponent(View);
const BoundaryTrigger = createBoundaryComponent(Pressable);
BoundaryRoot.displayName = "Transition.Boundary";
BoundaryView.displayName = "Transition.Boundary.View";
BoundaryTrigger.displayName = "Transition.Boundary.Trigger";
BoundaryTarget.displayName = "Transition.Boundary.Target";
Host.displayName = "Transition.Boundary.Host";

type BoundaryRootComponent = typeof BoundaryRoot;

/**
 * Shared-boundary component with static helpers.
 *
 * How measurement works:
 * 1. Destination screen captures bounds for a tag.
 * 2. Source screen captures bounds for the same concrete pair.
 * 3. The link is updated as layout changes.
 *
 * Runtime primitive:
 * - With an `onPress` handler, the root renders as a Pressable.
 * - Without an `onPress` handler, the root renders as a View.
 *
 * Use:
 * - `Boundary` for passive and pressable shared elements.
 * - `Boundary.Target` to measure a nested descendant instead of the root.
 * - `Boundary.Host` to make nested portal placement explicit.
 */
export interface BoundaryComponent extends BoundaryRootComponent {
	/**
	 * Optional nested measurement override inside a boundary root.
	 */
	Target: typeof BoundaryTarget;
	/**
	 * Explicit portal host for scrollable or otherwise clipped coordinate spaces.
	 */
	Host: typeof Host;
	/**
	 * @deprecated Use `Transition.Boundary` without `onPress`.
	 */
	View: typeof BoundaryView;
	/**
	 * @deprecated Use `Transition.Boundary` with `onPress`.
	 */
	Trigger: typeof BoundaryTrigger;
}

export type BoundaryProps = BoundaryComponentProps<BoundaryPrimitiveProps>;

export const Boundary = Object.assign(BoundaryRoot, {
	Target: BoundaryTarget,
	Host,
	View: BoundaryView,
	Trigger: BoundaryTrigger,
}) as BoundaryComponent;
