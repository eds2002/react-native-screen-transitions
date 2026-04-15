import { useGestureContext } from "../gestures.provider";
import type { GestureContextType } from "../types";

export type ScreenGestureTarget =
	| "self"
	| "parent"
	| "root"
	| { ancestor: number };

type ScreenGesture = GestureContextType["panGesture"] | null;

type ResolveScreenGestureTargetParams = {
	target: ScreenGestureTarget | undefined;
	self: GestureContextType | null | undefined;
};

const isAncestorTarget = (
	target: ScreenGestureTarget,
): target is { ancestor: number } => {
	return typeof target === "object" && target !== null && "ancestor" in target;
};

const getGestureAncestors = (
	self: GestureContextType,
): GestureContextType[] => {
	const ancestors: GestureContextType[] = [];

	let current = self.gestureContext;

	while (current) {
		ancestors.push(current);
		current = current.gestureContext;
	}

	return ancestors;
};

export const resolveScreenGestureTarget = ({
	target,
	self,
}: ResolveScreenGestureTargetParams): ScreenGesture => {
	if (!self) {
		return null;
	}

	if (!target || target === "self") {
		return self.panGesture ?? null;
	}

	const ancestors = getGestureAncestors(self);

	if (target === "parent") {
		return ancestors[0]?.panGesture ?? null;
	}

	if (target === "root") {
		return ancestors[ancestors.length - 1]?.panGesture ?? null;
	}

	if (!isAncestorTarget(target)) {
		return null;
	}

	const depth = target.ancestor;
	if (!Number.isInteger(depth) || depth < 1) {
		return null;
	}

	return ancestors[depth - 1]?.panGesture ?? null;
};

/**
 * Returns a screen navigation pan gesture.
 * Use this to coordinate child gestures with the navigation gesture.
 *
 * @example
 * ```tsx
 * const screenGesture = useScreenGesture();
 *
 * const myPanGesture = usePanGesture({
 *   requireToFail: screenGesture,
 *   onUpdate: (...) => {},
 * });
 * ```
 */
export const useScreenGesture = (target?: ScreenGestureTarget) => {
	const ctx = useGestureContext();
	return resolveScreenGestureTarget({
		target,
		self: ctx,
	});
};
