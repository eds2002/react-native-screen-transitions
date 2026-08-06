import type React from "react";
import { memo, useLayoutEffect } from "react";
import Animated from "react-native-reanimated";
import {
	useComposedSlotStyles,
	useSlotLayoutStyles,
} from "../../../providers/screen/styles";
import { logger } from "../../../utils/logger";
import {
	BoundaryContentPortal,
	BoundaryContentPortalHost,
} from "../portal/components/boundary-content-portal";
import { BoundaryPortal } from "../portal/components/boundary-portal";
import {
	TARGET_OUTSIDE_ROOT_WARNING,
	useBoundaryRootStore,
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
	const rootContext = useBoundaryRootStore();
	const boundaryId = rootContext?.boundTag.tag;
	const isActiveTarget = active === true && rootContext !== null;
	const portalRuntime = rootContext?.portalRuntime;
	const handoffEnabled = isActiveTarget && rootContext?.handoffEnabled === true;
	const shouldEscapeTargetToScreenHost =
		isActiveTarget && portalRuntime?.escapeClipping === true;

	const shouldApplyAssociatedStyleInline =
		isActiveTarget && portalRuntime?.escapeClipping !== true;
	const shouldApplyPortalLayoutStyle =
		isActiveTarget && portalRuntime?.escapeClipping === true;

	const associatedTargetStyles = useComposedSlotStyles(
		rootContext?.boundTag.tag,
		style,
	);
	const portalLayoutStyle = useSlotLayoutStyles(rootContext?.boundTag.tag);
	const measurementRef = isActiveTarget
		? rootContext.measurementRef
		: undefined;

	useLayoutEffect(() => {
		if (__DEV__ && rootContext === null) {
			logger.warn(TARGET_OUTSIDE_ROOT_WARNING);
		}
	}, [rootContext]);

	return (
		<BoundaryPortal
			boundaryId={boundaryId ?? ""}
			enabled={shouldEscapeTargetToScreenHost}
			localMeasurement={rootContext?.localMeasurement}
			placeholderRef={measurementRef}
		>
			<Animated.View
				{...rest}
				pointerEvents={pointerEvents}
				ref={shouldEscapeTargetToScreenHost ? undefined : measurementRef}
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
};

export const BoundaryTarget = memo(
	BoundaryTargetInner,
) as React.NamedExoticComponent<BoundaryTargetProps>;
