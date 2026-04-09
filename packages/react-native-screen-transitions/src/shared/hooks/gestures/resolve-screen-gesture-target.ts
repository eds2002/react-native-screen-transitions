import type { GestureContextType } from "../../providers/gestures";
import type { ScreenGestureTarget } from "./types";

type ScreenGesture = GestureContextType["panGesture"] | null;

type Params = {
	target: ScreenGestureTarget | undefined;
	self: GestureContextType | null | undefined;
};

const isAncestorTarget = (
	target: ScreenGestureTarget,
): target is { ancestor: number } => {
	return typeof target === "object" && target !== null && "ancestor" in target;
};

function getGestureAncestors(self: GestureContextType): GestureContextType[] {
	const ancestors: GestureContextType[] = [];

	let current = self.gestureContext;

	while (current) {
		ancestors.push(current);
		current = current.gestureContext;
	}

	return ancestors;
}

export function resolveScreenGestureTarget({
	target,
	self,
}: Params): ScreenGesture {
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
}
