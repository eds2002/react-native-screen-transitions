import type React from "react";
import { memo, useLayoutEffect } from "react";
import Animated from "react-native-reanimated";
import { logger } from "../../../utils/logger";
import { useComposedBoundaryStyle } from "../hooks/use-composed-boundary-style";
import { Portal } from "../portal/components/portal";
import {
	TARGET_OUTSIDE_ROOT_WARNING,
	useOptionalBoundaryRootStore,
} from "../providers/boundary-root.provider";

type BoundaryTargetProps = Omit<
	React.ComponentProps<typeof Animated.View>,
	"children"
> & {
	children?: React.ReactNode;
};

export const BOUNDARY_TARGET_ACTIVE_PROP = "__boundaryTargetActive" as const;
type InternalBoundaryTargetProps = BoundaryTargetProps & {
	[BOUNDARY_TARGET_ACTIVE_PROP]?: boolean;
};

const BoundaryTargetInner = (props: InternalBoundaryTargetProps) => {
	const {
		[BOUNDARY_TARGET_ACTIVE_PROP]: active,
		children,
		pointerEvents,
		style,
		...rest
	} = props;
	const rootContext = useOptionalBoundaryRootStore();
	const boundaryId = rootContext?.boundTag.tag;
	const isActiveTarget = active === true && rootContext !== null;
	const portalRuntime = rootContext?.portalRuntime;
	const handoffEnabled = isActiveTarget && rootContext?.handoffEnabled === true;
	const shouldEscapeTargetToScreenHost =
		isActiveTarget && portalRuntime?.escapeClipping === true;

	const associatedTargetStyles = useComposedBoundaryStyle(
		rootContext?.slotsMap,
		boundaryId,
		style,
		shouldEscapeTargetToScreenHost ? "layout" : "full",
	);

	const measurementRef = isActiveTarget
		? rootContext.measurementRef
		: undefined;

	useLayoutEffect(() => {
		if (__DEV__ && rootContext === null) {
			logger.warn(TARGET_OUTSIDE_ROOT_WARNING);
		}
	}, [rootContext]);

	return (
		<Portal
			mode="escapeClipping"
			boundaryId={boundaryId ?? ""}
			enabled={shouldEscapeTargetToScreenHost}
			placeholderRef={measurementRef}
		>
			<Animated.View
				{...rest}
				pointerEvents={pointerEvents}
				ref={shouldEscapeTargetToScreenHost ? undefined : measurementRef}
				style={[style, isActiveTarget ? associatedTargetStyles : undefined]}
				collapsable={false}
			>
				<Portal mode="handoff" boundaryId={boundaryId} enabled={handoffEnabled}>
					{children}
				</Portal>
			</Animated.View>
		</Portal>
	);
};

export const BoundaryTarget = memo(
	BoundaryTargetInner,
) as React.NamedExoticComponent<BoundaryTargetProps>;
