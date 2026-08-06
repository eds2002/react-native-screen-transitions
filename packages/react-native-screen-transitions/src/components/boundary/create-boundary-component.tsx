import {
	type ComponentType,
	cloneElement,
	forwardRef,
	memo,
	useMemo,
} from "react";
import Animated from "react-native-reanimated";
import {
	BOUNDARY_TARGET_ACTIVE_PROP,
	BoundaryTarget,
} from "./components/boundary-target";
import { BoundaryContentPortalHost } from "./portal/components/boundary-content-portal";
import { BoundaryPortal } from "./portal/components/boundary-portal";
import { BoundaryRootProvider } from "./providers/boundary-root.provider";
import type { BoundaryComponentProps } from "./types";
import { resolveBoundaryTarget } from "./utils/resolve-boundary-target";

interface CreateBoundaryComponentOptions {
	alreadyAnimated?: boolean;
}

export function createBoundaryComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateBoundaryComponentOptions = {},
) {
	const { alreadyAnimated = false } = options;
	const AnimatedComponent = alreadyAnimated
		? Wrapped
		: Animated.createAnimatedComponent(Wrapped);

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		BoundaryComponentProps<P>
	>((props, forwardedRef) => {
		const {
			enabled = true,
			group,
			id,
			anchor,
			scaleMode,
			target,
			method,
			style,
			handoff,
			escapeClipping,
			children,
			...rest
		} = props as any;
		const targetResolution = useMemo(() => {
			return resolveBoundaryTarget(children, {
				isTarget: (element) => element.type === BoundaryTarget,
				mapTarget: (element, selected) =>
					cloneElement(element, {
						[BOUNDARY_TARGET_ACTIVE_PROP]: selected,
					} as any),
			});
		}, [children]);
		const targetStyle = (
			targetResolution.target?.props as { style?: unknown } | undefined
		)?.style;

		return (
			<BoundaryRootProvider
				config={{ anchor, scaleMode, target, method }}
				enabled={enabled}
				escapeClipping={escapeClipping}
				forwardedRef={forwardedRef}
				group={group}
				handoff={handoff}
				hasTarget={targetResolution.target !== null}
				id={id}
				style={style}
				targetCount={targetResolution.targetCount}
				targetStyle={targetStyle}
			>
				{(root) => (
					<BoundaryPortal
						boundaryId={root.boundTag.tag}
						enabled={root.shouldRenderBoundaryRootThroughPortal}
						localMeasurement={root.localMeasurement}
						placeholderRef={root.measurementRef}
					>
						<AnimatedComponent
							{...rest}
							ref={root.ref}
							style={[style, root.attachedStyle]}
							collapsable={false}
						>
							<BoundaryContentPortalHost
								boundaryId={root.boundTag.tag}
								enabled={root.shouldRenderHandoffHost}
								screenKey={root.currentScreenKey}
							>
								{targetResolution.children}
							</BoundaryContentPortalHost>
						</AnimatedComponent>
					</BoundaryPortal>
				)}
			</BoundaryRootProvider>
		);
	});

	// The HOC's runtime identity (animated + memoized forwardRef) is not
	// expressible against the public boundary props, so assert it here.
	return memo(Inner) as unknown as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			BoundaryComponentProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
