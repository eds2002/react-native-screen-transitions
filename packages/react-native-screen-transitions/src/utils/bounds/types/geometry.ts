type GeometryBase = {
	entering: boolean;
};

export type RelativeGeometry = GeometryBase & {
	dx: number;
	dy: number;
	scaleX: number;
	scaleY: number;
};

export type ContentTransformGeometry = GeometryBase & {
	tx: number;
	ty: number;
	s: number;
};

/** A rect in window coordinates (a measurement's shape). */
export type FrameRect = {
	pageX: number;
	pageY: number;
	width: number;
	height: number;
};

/**
 * Where a screen draws its content this frame: `p -> c + t + R(rot) · diag(sx, sy) · (p - c)`
 * around the screen's center `c` (the default transform origin). Translation, rotation and scale are
 * read; a screen that skews is treated as if it only translated, rotated and scaled.
 */
export type ScreenTransform = {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	/** Rotation in radians (absent when 0). */
	rot?: number;
	/** The screen's size, for its center. */
	width: number;
	height: number;
};
