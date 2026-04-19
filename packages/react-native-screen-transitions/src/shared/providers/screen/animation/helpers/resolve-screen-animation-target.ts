import type { ScreenAnimationTarget } from "../types";

type Params<T> = {
	target: ScreenAnimationTarget | undefined;
	self: T;
	ancestors: T[];
};

const isAncestorTarget = (
	target: ScreenAnimationTarget,
): target is { ancestor: number } => {
	return typeof target === "object" && target !== null && "ancestor" in target;
};

export function resolveScreenAnimationTarget<T>({
	target,
	self,
	ancestors,
}: Params<T>): T {
	if (!target || target === "self") {
		return self;
	}

	if (target === "parent") {
		return ancestors[0] ?? self;
	}

	if (target === "root") {
		return ancestors[ancestors.length - 1] ?? self;
	}

	if (!isAncestorTarget(target)) {
		return self;
	}

	const depth = target.ancestor;
	if (!Number.isInteger(depth) || depth < 1) {
		return self;
	}

	return ancestors[depth - 1] ?? self;
}
