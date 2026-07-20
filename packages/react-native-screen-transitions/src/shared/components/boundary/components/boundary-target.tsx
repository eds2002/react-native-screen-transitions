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
import {
	BoundaryContentPortal,
	BoundaryContentPortalHost,
} from "../portal/components/boundary-content-portal";
import { BoundaryPortal } from "../portal/components/boundary-portal";
import { useBoundaryRootContext } from "../providers/boundary-root.provider";

type BoundaryTargetProps = Omit<
	React.ComponentProps<typeof Animated.View>,
	"children"
> & {
	children?: React.ReactNode;
};

export const BoundaryTarget = memo(function BoundaryTarget(
	props: BoundaryTargetProps,
) {
	const { children, pointerEvents, style, ...rest } = props;
	const targetAnimatedRef = useAnimatedRef<View>();
	const targetEscapePlaceholderRef = useAnimatedRef<View>();
	const rootContext = useBoundaryRootContext();
	const boundaryId = rootContext?.boundTag.tag;
	const isActiveTarget = rootContext?.activeTargetRef === targetAnimatedRef;
	const portalRuntime = rootContext?.portalRuntime;
	const handoffEnabled = isActiveTarget && rootContext?.handoffEnabled === true;
	const shouldEscapeTargetToScreenHost =
		portalRuntime?.escapeClipping === true && boundaryId !== undefined;

	const shouldApplyAssociatedStyleInline =
		isActiveTarget && portalRuntime?.escapeClipping !== true;
	const shouldApplyPortalLayoutStyle =
		isActiveTarget && portalRuntime?.escapeClipping === true;

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
			>
				<BoundaryContentPortalHost
					boundaryId={boundaryId ?? ""}
					enabled={handoffEnabled}
					screenKey={rootContext?.currentScreenKey ?? ""}
				>
					<BoundaryContentPortal
						boundaryId={boundaryId}
						enabled={handoffEnabled}
					>
						{children}
					</BoundaryContentPortal>
				</BoundaryContentPortalHost>
			</Animated.View>
		</BoundaryPortal>
	);
});
