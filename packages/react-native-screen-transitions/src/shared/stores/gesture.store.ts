import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type {
	ActiveGesture,
	ResolvedPanGestureDirection,
} from "../types/gesture.types";
import { createStore } from "../utils/create-store";

type GestureRawStoreMap = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	scale: SharedValue<number>;
	normScale: SharedValue<number>;
	rotation: SharedValue<number>;
};

type GestureSnapshotStoreMap = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	velocity: SharedValue<number>;
	scale: SharedValue<number>;
	normScale: SharedValue<number>;
	focalX: SharedValue<number>;
	focalY: SharedValue<number>;
	rotation: SharedValue<number>;
	raw: GestureRawStoreMap;
	active: SharedValue<ActiveGesture | null>;
	direction: SharedValue<ResolvedPanGestureDirection | null>;
};

type GestureInternalStoreMap = {
	progressBaseline: SharedValue<number>;
	progressDeltaX: SharedValue<number>;
	progressDeltaY: SharedValue<number>;
	lockedSnapPoint: SharedValue<number | null>;
	snapshot: GestureSnapshotStoreMap;
};

export type GestureStoreMap = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	velocity: SharedValue<number>;
	scale: SharedValue<number>;
	normScale: SharedValue<number>;
	focalX: SharedValue<number>;
	focalY: SharedValue<number>;
	rotation: SharedValue<number>;
	raw: GestureRawStoreMap;
	internal: GestureInternalStoreMap;
	dismissing: SharedValue<number>;
	dragging: SharedValue<number>;
	settling: SharedValue<number>;
	active: SharedValue<ActiveGesture | null>;
	/** @deprecated Use `active` instead. */
	direction: SharedValue<ResolvedPanGestureDirection | null>;

	/**
	 * @deprecated Use `normX` instead.
	 */
	normalizedX: SharedValue<number>;
	/**
	 * @deprecated Use `normY` instead.
	 */
	normalizedY: SharedValue<number>;
	/**
	 * @deprecated Use `dismissing` instead.
	 */
	isDismissing: SharedValue<number>;
	/**
	 * @deprecated Use `dragging` instead.
	 */
	isDragging: SharedValue<number>;
};

function createGestureBag(): GestureStoreMap {
	const progressBaseline = makeMutable(0);
	const progressDeltaX = makeMutable(0);
	const progressDeltaY = makeMutable(0);
	const lockedSnapPoint = makeMutable<number | null>(null);
	const normX = makeMutable(0);
	const normY = makeMutable(0);
	const scale = makeMutable(1);
	const normScale = makeMutable(0);
	const dismissing = makeMutable(0);
	const dragging = makeMutable(0);
	const settling = makeMutable(0);
	const active = makeMutable<ActiveGesture | null>(null);

	return {
		x: makeMutable(0),
		y: makeMutable(0),
		normX,
		normY,
		velocity: makeMutable(0),
		scale,
		normScale,
		focalX: makeMutable(0),
		focalY: makeMutable(0),
		rotation: makeMutable(0),
		raw: {
			x: makeMutable(0),
			y: makeMutable(0),
			normX: makeMutable(0),
			normY: makeMutable(0),
			scale: makeMutable(1),
			normScale: makeMutable(0),
			rotation: makeMutable(0),
		},
		internal: {
			progressBaseline,
			progressDeltaX,
			progressDeltaY,
			lockedSnapPoint,
			snapshot: {
				x: makeMutable(0),
				y: makeMutable(0),
				normX: makeMutable(0),
				normY: makeMutable(0),
				velocity: makeMutable(0),
				scale: makeMutable(1),
				normScale: makeMutable(0),
				focalX: makeMutable(0),
				focalY: makeMutable(0),
				rotation: makeMutable(0),
				raw: {
					x: makeMutable(0),
					y: makeMutable(0),
					normX: makeMutable(0),
					normY: makeMutable(0),
					scale: makeMutable(1),
					normScale: makeMutable(0),
					rotation: makeMutable(0),
				},
				active: makeMutable<ActiveGesture | null>(null),
				direction: makeMutable<ResolvedPanGestureDirection | null>(null),
			},
		},
		dismissing,
		dragging,
		settling,
		active,
		direction: makeMutable<ResolvedPanGestureDirection | null>(null),

		// Deprecated aliases (same underlying SharedValue)
		normalizedX: normX,
		normalizedY: normY,
		isDismissing: dismissing,
		isDragging: dragging,
	};
}

/**
 * Route-keyed gesture state used by the transition system while a screen is
 * being dragged or dismissed. It stores raw and normalized gesture values,
 * dismissal flags, and the active gesture. `getCachedBag()` provides
 * a stable neutral fallback bag for cases where a route should not own live
 * gesture state.
 */
export const GestureStore = createStore<GestureStoreMap>({
	createBag: createGestureBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.x);
		cancelAnimation(bag.y);
		cancelAnimation(bag.normX);
		cancelAnimation(bag.normY);
		cancelAnimation(bag.velocity);
		cancelAnimation(bag.scale);
		cancelAnimation(bag.normScale);
		cancelAnimation(bag.focalX);
		cancelAnimation(bag.focalY);
		cancelAnimation(bag.rotation);
		cancelAnimation(bag.raw.x);
		cancelAnimation(bag.raw.y);
		cancelAnimation(bag.raw.normX);
		cancelAnimation(bag.raw.normY);
		cancelAnimation(bag.raw.scale);
		cancelAnimation(bag.raw.normScale);
		cancelAnimation(bag.raw.rotation);
		cancelAnimation(bag.internal.progressBaseline);
		cancelAnimation(bag.internal.progressDeltaX);
		cancelAnimation(bag.internal.progressDeltaY);
		cancelAnimation(bag.internal.lockedSnapPoint);
		cancelAnimation(bag.internal.snapshot.x);
		cancelAnimation(bag.internal.snapshot.y);
		cancelAnimation(bag.internal.snapshot.normX);
		cancelAnimation(bag.internal.snapshot.normY);
		cancelAnimation(bag.internal.snapshot.velocity);
		cancelAnimation(bag.internal.snapshot.scale);
		cancelAnimation(bag.internal.snapshot.normScale);
		cancelAnimation(bag.internal.snapshot.focalX);
		cancelAnimation(bag.internal.snapshot.focalY);
		cancelAnimation(bag.internal.snapshot.rotation);
		cancelAnimation(bag.internal.snapshot.raw.x);
		cancelAnimation(bag.internal.snapshot.raw.y);
		cancelAnimation(bag.internal.snapshot.raw.normX);
		cancelAnimation(bag.internal.snapshot.raw.normY);
		cancelAnimation(bag.internal.snapshot.raw.scale);
		cancelAnimation(bag.internal.snapshot.raw.normScale);
		cancelAnimation(bag.internal.snapshot.raw.rotation);
		cancelAnimation(bag.internal.snapshot.active);
		cancelAnimation(bag.internal.snapshot.direction);
		cancelAnimation(bag.dismissing);
		cancelAnimation(bag.dragging);
		cancelAnimation(bag.settling);
		cancelAnimation(bag.active);
		cancelAnimation(bag.direction);
	},
});
