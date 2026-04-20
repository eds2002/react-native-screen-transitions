export type ChainTarget = "self" | "parent" | "root" | { ancestor: number };

type ResolveChainTargetParams<T> = {
	target: ChainTarget | undefined;
	self: T | null | undefined;
	ancestors: readonly T[];
};

const isAncestorTarget = (
	target: ChainTarget,
): target is { ancestor: number } => {
	return typeof target === "object" && target !== null && "ancestor" in target;
};

export function resolveChainTarget<T>({
	target,
	self,
	ancestors,
}: ResolveChainTargetParams<T>): T | null {
	if (!self) {
		return null;
	}

	if (!target || target === "self") {
		return self;
	}

	if (target === "parent") {
		return ancestors[0] ?? null;
	}

	if (target === "root") {
		return ancestors[ancestors.length - 1] ?? null;
	}

	if (!isAncestorTarget(target)) {
		return null;
	}

	const depth = target.ancestor;
	if (!Number.isInteger(depth) || depth < 1) {
		return null;
	}

	return ancestors[depth - 1] ?? null;
}
