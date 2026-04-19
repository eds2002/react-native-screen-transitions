import type { GestureContextType } from "../../providers/gestures";
import type { ScreenGestureTarget } from "./types";

type ScreenGestureRef = GestureContextType["panGestureRef"] | null;

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
	const startIsolated = self.isIsolated;
	let current = self.ancestorContext;

	while (current) {
		if (current.isIsolated !== startIsolated) {
			break;
		}

		ancestors.push(current);
		current = current.ancestorContext;
	}

	return ancestors;
}

export function resolveScreenGestureTarget({
	target,
	self,
}: Params): ScreenGestureRef {
	if (!self) {
		return null;
	}

	if (!target || target === "self") {
		return self.panGestureRef ?? null;
	}

	const ancestors = getGestureAncestors(self);

	if (target === "parent") {
		return ancestors[0]?.panGestureRef ?? null;
	}

	if (target === "root") {
		return ancestors[ancestors.length - 1]?.panGestureRef ?? null;
	}

	if (!isAncestorTarget(target)) {
		return null;
	}

	const depth = target.ancestor;
	if (!Number.isInteger(depth) || depth < 1) {
		return null;
	}

	return ancestors[depth - 1]?.panGestureRef ?? null;
}
