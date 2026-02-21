import { useLocalSearchParams, useSegments } from "expo-router";

export type StackType = "blank-stack" | "native-stack";

const STACK_TYPES: readonly StackType[] = ["blank-stack", "native-stack"];

export function resolveStackType(value: unknown): StackType | null {
	if (typeof value !== "string") return null;
	return STACK_TYPES.includes(value as StackType) ? (value as StackType) : null;
}

export function useResolvedStackType(): StackType {
	const params = useLocalSearchParams<{ stackType?: string | string[] }>();
	const segments = useSegments();

	const paramValue = Array.isArray(params.stackType)
		? params.stackType[0]
		: params.stackType;
	const fromParam = resolveStackType(paramValue);
	if (fromParam) return fromParam;

	for (const segment of segments) {
		const resolved = resolveStackType(segment);
		if (resolved) return resolved;
	}

	return "blank-stack";
}

export function buildStackPath(
	stackType: StackType,
	childPath = "",
): `/${string}` {
	const normalized = childPath.replace(/^\/+/, "");
	return (`/${stackType}${normalized ? `/${normalized}` : ""}`) as `/${string}`;
}
