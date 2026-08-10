import type { DescriptorDerivationsContextValue } from "../descriptors.provider";

type ParentDescriptorState = Pick<
	DescriptorDerivationsContextValue,
	"currentScreenKey" | "ancestorKeys"
>;

export const deriveStructuralAncestorKeys = (
	parent: ParentDescriptorState | null,
): string[] => {
	if (!parent) return [];
	return [parent.currentScreenKey, ...parent.ancestorKeys];
};
