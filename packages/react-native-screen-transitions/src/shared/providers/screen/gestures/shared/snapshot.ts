import type { GestureStoreMap } from "../../../../stores/gesture.store";

type SnapshotGestureHandoffOptions = {
	velocity?: number;
};

export const snapshotGestureHandoff = (
	gestures: GestureStoreMap,
	options?: SnapshotGestureHandoffOptions,
) => {
	"worklet";
	const snapshot = gestures.internal.snapshot;

	snapshot.x.set(gestures.x.get());
	snapshot.y.set(gestures.y.get());
	snapshot.normX.set(gestures.normX.get());
	snapshot.normY.set(gestures.normY.get());
	snapshot.velocity.set(options?.velocity ?? gestures.velocity.get());
	snapshot.scale.set(gestures.scale.get());
	snapshot.normScale.set(gestures.normScale.get());
	snapshot.focalX.set(gestures.focalX.get());
	snapshot.focalY.set(gestures.focalY.get());
	snapshot.rotation.set(gestures.rotation.get());
	snapshot.raw.x.set(gestures.raw.x.get());
	snapshot.raw.y.set(gestures.raw.y.get());
	snapshot.raw.normX.set(gestures.raw.normX.get());
	snapshot.raw.normY.set(gestures.raw.normY.get());
	snapshot.raw.scale.set(gestures.raw.scale.get());
	snapshot.raw.normScale.set(gestures.raw.normScale.get());
	snapshot.raw.rotation.set(gestures.raw.rotation.get());
	snapshot.active.set(gestures.active.get());
	snapshot.direction.set(gestures.direction.get());
};
