import {
	Children,
	cloneElement,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";

type ResolveBoundaryTargetOptions = {
	isTarget: (element: ReactElement) => boolean;
	mapTarget?: (element: ReactElement, selected: boolean) => ReactElement;
};

export const resolveBoundaryTarget = (
	children: ReactNode,
	options: ResolveBoundaryTargetOptions,
): {
	children: ReactNode;
	target: ReactElement | null;
	targetCount: number;
} => {
	let target: ReactElement | null = null;
	let targetCount = 0;
	const map = (nodes: ReactNode): ReactNode =>
		Children.map(nodes, (node) => {
			if (!isValidElement<{ children?: ReactNode }>(node)) return node;
			if (node.type === Fragment) {
				return cloneElement(node, undefined, map(node.props.children));
			}
			if (!options.isTarget(node)) return node;
			target ??= node;
			targetCount += 1;
			return options.mapTarget?.(node, targetCount === 1) ?? node;
		});

	const mappedChildren = map(children);
	return { children: target ? mappedChildren : children, target, targetCount };
};
