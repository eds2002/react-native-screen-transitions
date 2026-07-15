import type React from "react";
import { memo, useMemo } from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import {
	useComposedSlotStyles,
	useSlotLayoutStyles,
} from "../../../providers/screen/styles";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import { useRegisterTarget } from "../hooks/use-register-target";
import { BoundaryContentPortal } from "../portal/components/boundary-content-portal";
import { BoundaryPortal } from "../portal/components/boundary-portal";
import { useBoundaryRootContext } from "../providers/boundary-root.provider";

type BoundaryTargetProps = React.ComponentProps<typeof Animated.View>;

export const BoundaryTarget = memo(function BoundaryTarget(
	props: BoundaryTargetProps,
) {
	const { pointerEvents, style, ...rest } = props;
	const targetAnimatedRef = useAnimatedRef<View>();
	const targetEscapePlaceholderRef = useAnimatedRef<View>();
	const rootContext = useBoundaryRootContext();
	const boundaryId = rootContext?.boundTag.tag;
	const isActiveTarget = rootContext?.activeTargetRef === targetAnimatedRef;
	const portalRuntime = rootContext?.portalRuntime;
	const portalPointerEvents =
		typeof pointerEvents === "string" ? pointerEvents : undefined;
	const shouldEscapeTargetToScreenHost =
		portalRuntime?.escapeClipping === true && boundaryId !== undefined;

	const shouldApplyAssociatedStyleInline =
		isActiveTarget && portalRuntime?.enabled !== true;
	const shouldApplyPortalLayoutStyle =
		isActiveTarget && portalRuntime?.enabled === true;

	const associatedTargetStyles = useComposedSlotStyles(
		rootContext?.boundTag.tag,
		style,
	);
	const portalLayoutStyle = useSlotLayoutStyles(rootContext?.boundTag.tag);
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);

	const measurementRef = shouldEscapeTargetToScreenHost
		? targetEscapePlaceholderRef
		: targetAnimatedRef;

	useRegisterTarget({ preparedStyles, measurementRef, targetAnimatedRef });

	return (
		<BoundaryPortal
			boundaryId={boundaryId ?? ""}
			enabled={shouldEscapeTargetToScreenHost}
			placeholderRef={targetEscapePlaceholderRef}
			pointerEvents={portalPointerEvents}
		>
			<BoundaryContentPortal
				boundaryId={boundaryId}
				enabled={portalRuntime?.handoff === true}
				pointerEvents={portalPointerEvents}
			>
				<Animated.View
					{...rest}
					pointerEvents={pointerEvents}
					ref={targetAnimatedRef}
					style={[
						style,
						shouldApplyAssociatedStyleInline
							? associatedTargetStyles
							: undefined,
						shouldApplyPortalLayoutStyle ? portalLayoutStyle : undefined,
					]}
					collapsable={false}
				/>
			</BoundaryContentPortal>
		</BoundaryPortal>
	);
});
