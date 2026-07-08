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
import { Portal } from "../portal/components/portal";
import { useBoundaryRootContext } from "../providers/boundary-root.provider";

type BoundaryTargetProps = React.ComponentProps<typeof Animated.View>;

export const BoundaryTarget = memo(function BoundaryTarget(
	props: BoundaryTargetProps,
) {
	const { pointerEvents, style, ...rest } = props;
	const targetAnimatedRef = useAnimatedRef<View>();
	const placeholderAnimatedRef = useAnimatedRef<View>();
	const rootContext = useBoundaryRootContext();
	const isActiveTarget = rootContext?.activeTargetRef === targetAnimatedRef;
	const portalRuntime = rootContext?.portalRuntime;
	const portalPointerEvents =
		typeof pointerEvents === "string" ? pointerEvents : undefined;

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

	// Handoff moves the target payload out of this layout slot; measure the
	// placeholder in that case. Escape-clipping moves the root boundary instead,
	// so this target still has a real local measurement surface.
	const measurementRef = portalRuntime?.handoff
		? placeholderAnimatedRef
		: targetAnimatedRef;

	useRegisterTarget({ preparedStyles, measurementRef, targetAnimatedRef });

	return (
		<Portal
			id={rootContext?.boundTag.tag}
			handoff={portalRuntime?.handoff}
			placeholderRef={placeholderAnimatedRef}
			placeholderStyle={style as any}
			pointerEvents={portalPointerEvents}
		>
			<Animated.View
				{...rest}
				pointerEvents={pointerEvents}
				ref={targetAnimatedRef}
				style={[
					style,
					shouldApplyAssociatedStyleInline ? associatedTargetStyles : undefined,
					shouldApplyPortalLayoutStyle ? portalLayoutStyle : undefined,
				]}
				collapsable={false}
			/>
		</Portal>
	);
});
