import {
	type ComponentType,
	cloneElement,
	forwardRef,
	memo,
	useMemo,
} from "react";
import Animated from "react-native-reanimated";
import { isTeleportAvailable } from "../../utils/teleport";
import { Portal } from "./portal/components/portal";
import { BoundaryRootProvider } from "./root/boundary-root.provider";
import {
	BOUNDARY_TARGET_ACTIVE_PROP,
	BoundaryTarget,
} from "./root/boundary-target";
import { resolveBoundaryTarget } from "./root/resolve-boundary-target";
import { splitBoundaryLayoutStyle } from "./root/split-layout-style";
import type { BoundaryComponentProps } from "./types";

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
			animate,
			handoff,
			escapeClipping,
			children,
			...rest
		} = props as any;

		const config = useMemo(
			() => ({ anchor, scaleMode, target, method }),
			[anchor, scaleMode, target, method],
		);

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

		// An escaping root sits in a placeholder that is measured in its place: the placeholder takes
		// the root's box (margins, position, size), the root fills it.
		const escapesRoot = isTeleportAvailable && targetResolution.target === null;
		const split = useMemo(
			() => (escapesRoot ? splitBoundaryLayoutStyle(style) : null),
			[escapesRoot, style],
		);
		const rootStyle = split ? split.inner : style;

		return (
			<BoundaryRootProvider
				animate={animate}
				config={config}
				enabled={enabled}
				escapeClipping={escapeClipping}
				forwardedRef={forwardedRef}
				group={group}
				handoff={handoff}
				hasTarget={targetResolution.target !== null}
				id={id}
				style={style}
				rootStyle={rootStyle}
				targetCount={targetResolution.targetCount}
				targetStyle={targetStyle}
			>
				{(root) => (
					<Portal
						mode="escapeClipping"
						boundaryId={root.boundTag.tag}
						enabled={root.shouldRenderBoundaryRootThroughPortal}
						placeholderRef={root.measurementRef}
						placeholderStyle={split?.outer}
					>
						<AnimatedComponent
							{...rest}
							ref={root.ref}
							style={[
								root.shouldRenderBoundaryRootThroughPortal ? rootStyle : style,
								root.attachedStyle,
							]}
							collapsable={false}
						>
							<Portal
								mode="handoff"
								boundaryId={root.boundTag.tag}
								enabled={root.shouldRenderHandoffHost}
							>
								{targetResolution.children}
							</Portal>
						</AnimatedComponent>
					</Portal>
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
