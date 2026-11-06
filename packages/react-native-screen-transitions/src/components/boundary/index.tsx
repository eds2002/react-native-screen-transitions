import {
	type ComponentProps,
	forwardRef,
	memo,
	type NamedExoticComponent,
} from "react";
import { View, type ViewProps } from "react-native";
import { Pressable, type PressableProps } from "react-native-gesture-handler";
import { logger } from "../../utils/logger";
import { BoundaryTarget } from "./components/boundary-target";
import { createBoundaryComponent } from "./create-boundary-component";
import { PortalOverlay } from "./portal/components/portal-overlay";
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
BoundaryRoot.displayName = "Transition.Boundary";
BoundaryTarget.displayName = "Transition.Boundary.Target";

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
 * - `Boundary.Target` as a direct child to measure it instead of the root.
 */
export interface BoundaryComponent extends BoundaryRootComponent {
	/**
	 * Optional direct-child measurement override inside a boundary root.
	 */
	Target: typeof BoundaryTarget;
	/**
	 * @deprecated Escaped boundaries go to their screen's overlay on their own and follow their
	 * scroll views while they are out: there is no host to place. Still renders; remove it.
	 */
	Host: NamedExoticComponent<
		Omit<ComponentProps<typeof PortalOverlay>, "fallback">
	>;
}

export type BoundaryProps = BoundaryComponentProps<BoundaryPrimitiveProps>;

const DeprecatedBoundaryHost = memo(function BoundaryHost(
	props: Omit<ComponentProps<typeof PortalOverlay>, "fallback">,
) {
	if (__DEV__) {
		logger.warnOnce(
			"boundary:host-deprecated",
			"Transition.Boundary.Host is deprecated: escaped boundaries go to their screen's overlay on their own and follow their scroll views. Remove it.",
		);
	}
	return <PortalOverlay {...props} />;
});

export const Boundary = Object.assign(BoundaryRoot, {
	Target: BoundaryTarget,
	Host: DeprecatedBoundaryHost,
}) as BoundaryComponent;
