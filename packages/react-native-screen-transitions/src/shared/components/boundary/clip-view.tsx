import { forwardRef, useMemo } from "react";
import { StyleSheet, type View } from "react-native";
import Animated from "react-native-reanimated";
import { ClipHostUnit, type TransitionClipViewProps } from "../clip-view";
import { assertValidMaximumSize } from "../clip-view/helpers";
import {
	BoundaryContentPortal,
	BoundaryContentPortalHost,
} from "./portal/components/boundary-content-portal";
import { BoundaryPortal } from "./portal/components/boundary-portal";
import { BoundaryRootProvider } from "./providers/boundary-root.provider";
import type { BoundaryOwnProps } from "./types";

export type BoundaryClipViewProps = Omit<TransitionClipViewProps, "styleId"> &
	BoundaryOwnProps;

/**
 * A fixed in-flow boundary footprint whose complete SmoothClip host unit is
 * moved by the existing escape/handoff portals. The driver lives inside that
 * stable unit, so native attachment can change without allocating a new
 * identity.
 */
export const BoundaryClipView = forwardRef<View, BoundaryClipViewProps>(
	function BoundaryClipView(
		{
			anchor,
			escapeClipping,
			enabled = true,
			group,
			handoff,
			id,
			maximumSize,
			method,
			scaleMode,
			target,
			...clipViewProps
		},
		forwardedRef,
	) {
		assertValidMaximumSize(maximumSize);
		const placeholderStyle = useMemo(
			() => ({
				height: maximumSize.height,
				width: maximumSize.width,
			}),
			[maximumSize.height, maximumSize.width],
		);

		return (
			<BoundaryRootProvider
				config={{ anchor, scaleMode, target, method }}
				enabled={enabled}
				escapeClipping={escapeClipping}
				group={group}
				handoff={handoff}
				id={id}
				style={placeholderStyle}
				wholeHostPortal
			>
				{(root) => (
					<BoundaryPortal
						boundaryId={root.boundTag.tag}
						filterClipResiduals
						enabled={root.shouldRenderBoundaryRootThroughPortal}
						placeholderRef={root.rootEscapePlaceholderRef}
					>
						<Animated.View
							ref={root.ref}
							pointerEvents="box-none"
							style={placeholderStyle}
							collapsable={false}
						>
							{/*
							 * Inline/handoff units resolve the slot on ClipHostUnit's visual
							 * carrier. Escape portals already apply that slot on the screen-level
							 * PortalBoundaryHost, so the moved unit disables its local copy. Do
							 * not also attach root.attachedStyle here: that would double transforms.
							 */}
							<BoundaryContentPortalHost
								boundaryId={root.boundTag.tag}
								enabled={root.shouldRenderHandoffHost}
								screenKey={root.currentScreenKey}
							>
								<BoundaryContentPortal
									boundaryId={root.boundTag.tag}
									enabled={root.shouldRenderHandoffHost}
								>
									<ClipHostUnit
										{...clipViewProps}
										absolute
										maximumSize={maximumSize}
										outerStyle={[styles.absoluteUnit, placeholderStyle]}
										ref={forwardedRef}
										resolveSlotStyle={
											!root.shouldRenderBoundaryRootThroughPortal
										}
										styleId={root.boundTag.tag}
									/>
								</BoundaryContentPortal>
							</BoundaryContentPortalHost>
						</Animated.View>
					</BoundaryPortal>
				)}
			</BoundaryRootProvider>
		);
	},
);

BoundaryClipView.displayName = "Transition.Boundary.ClipView";

const styles = StyleSheet.create({
	absoluteUnit: {
		left: 0,
		position: "absolute",
		top: 0,
	},
});
