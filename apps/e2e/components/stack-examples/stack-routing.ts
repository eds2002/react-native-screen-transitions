export function buildStackPath<T extends string>(
	childPath: T,
): `/blank-stack/${T}`;
export function buildStackPath(): "/blank-stack";
export function buildStackPath(childPath = ""): string {
	return `/blank-stack${childPath ? `/${childPath}` : ""}`;
}
