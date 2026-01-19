/**
 * Gesture Ownership System Types
 *
 * Core principles:
 * 1. Gestures dismiss stacks, not screens
 * 2. Ownership is per-direction (4 independent directions)
 * 3. Shadowing: child claiming same direction blocks parent
 * 4. Inheritance: no local claim walks up tree to find owner
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
 * - gestureEnabled is true AND
 * - gestureDirection includes that direction
 *
 * For snap points, both directions on the axis are claimed automatically.
 */
export type ClaimedDirections = Record<Direction, boolean>;

/**
 * Empty claims - used when gestureEnabled is false.
 */
export const NO_CLAIMS: ClaimedDirections = {
	vertical: false,
	"vertical-inverted": false,
	horizontal: false,
	"horizontal-inverted": false,
};

/**
 * Ownership status for a direction relative to the current screen.
 *
 * - 'self': Current screen owns this direction (should activate)
 * - 'ancestor': An ancestor owns this direction (should fail to bubble up)
 * - 'none': No one owns this direction (should fail, no gesture response)
 */
export type OwnershipStatus = "self" | "ancestor" | "none";

/**
 * Map of ownership status for all four directions.
 * Pre-computed during render for worklet access.
 */
export type DirectionOwnership = Record<Direction, OwnershipStatus>;

/**
 * Empty ownership - used when no gestures are configured anywhere.
 */
export const NO_OWNERSHIP: DirectionOwnership = {
	vertical: "none",
	"vertical-inverted": "none",
	horizontal: "none",
	"horizontal-inverted": "none",
};
