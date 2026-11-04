/**
 * Gesture Ownership System Types
 *
 * Core principles:
 * 1. Gestures dismiss stacks, not screens
 * 2. Ownership is per-direction (4 independent directions)
 * 3. Shadowing: child claiming same direction blocks parent
 * 4. Inheritance: topology resolves the nearest claiming ancestor
 */

/**
 * The four independent gesture directions.
 * Each direction is owned independently.
 *
 * Uses the same format as GestureDirection from gesture.types.ts
 * (excluding 'bidirectional' which expands to all four).
 */
export type Direction =
	| "vertical"
	| "vertical-inverted"
	| "horizontal"
	| "horizontal-inverted";

/**
 * All possible directions as an array for iteration.
 */
export const DIRECTIONS: Direction[] = [
	"vertical",
	"vertical-inverted",
	"horizontal",
	"horizontal-inverted",
];

/**
 * Map of which directions a screen claims ownership of.
 * A screen claims a direction when:
 * - direction claiming is enabled AND
 * - gestureDirection includes that direction
 *
 * For snap points, both directions on the axis are claimed automatically.
 */
export type ClaimedDirections = Record<Direction, boolean>;

/**
 * Empty claims - used when direction claiming is disabled.
 */
export const NO_CLAIMS: ClaimedDirections = {
	vertical: false,
	"vertical-inverted": false,
	horizontal: false,
	"horizontal-inverted": false,
};
