export type GeometryBase = {
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
