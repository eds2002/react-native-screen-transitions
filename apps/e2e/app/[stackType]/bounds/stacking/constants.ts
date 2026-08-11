export const STACKING_CARD_BOUNDARY_ID = "stacking-card";
export const STACKING_BUTTON_BOUNDARY_ID = "stacking-button";

export type StackingBoundaryId =
	| typeof STACKING_CARD_BOUNDARY_ID
	| typeof STACKING_BUTTON_BOUNDARY_ID;

export function parseStackDepth(value: string | string[] | undefined): number {
	const rawValue = Array.isArray(value) ? value[0] : value;
	const parsedValue = Number.parseInt(rawValue ?? "0", 10);
	return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}
