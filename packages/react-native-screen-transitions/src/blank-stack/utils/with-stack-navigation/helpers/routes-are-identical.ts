import type { Route } from "@react-navigation/native";

export const routesAreIdentical = (
	a: Route<string>[],
	b: Route<string>[],
): boolean => {
	if (a === b) return true;
	if (a.length !== b.length) return false;

	return a.every((route, index) => route === b[index]);
};
