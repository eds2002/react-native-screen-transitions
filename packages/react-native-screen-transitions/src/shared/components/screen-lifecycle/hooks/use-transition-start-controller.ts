import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import type { SystemStoreMap } from "../../../stores/system.store";

/**
 * Structural placeholder for the v3.5 lifecycle pipeline.
 *
 * The actual lifecycle request/blocking controller lands in the next phase once
 * `system.store` grows the request state needed by the `next` pipeline.
 */
export const useTransitionStartController = (_params: {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	system: SystemStoreMap;
	onManagedCloseFinish?: (finished: boolean) => void;
	onNativeCloseFinish?: (finished: boolean) => void;
}) => {};
