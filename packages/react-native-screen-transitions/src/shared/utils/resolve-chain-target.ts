export type ChainTarget = { depth: number };

type ResolveChainTargetParams<T> = {
	target: ChainTarget | undefined;
	self: T | null | undefined;
	ancestors: readonly T[];
};

export function resolveChainTarget<T>({
	target,
	self,
	ancestors,
}: ResolveChainTargetParams<T>): T | null {
	"worklet";
	if (!self) {
		return null;
	}

	const depth = target?.depth ?? 0;
	if (!Number.isInteger(depth)) {
		return null;
	}

	if (depth === 0) {
		return self;
	}

	if (depth > 0) {
		return null;
	}

	return ancestors[Math.abs(depth) - 1] ?? null;
}
