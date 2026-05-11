import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { hasDestinationLink } from "../../../stores/bounds/internals/links";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../stores/system.store";
import type { MeasureParams } from "../types";
import { createLinkContext } from "./helpers/boundary-link-context";
import { shouldBlockInitialDestinationMeasurement } from "./helpers/measurement-rules";

const VIEWPORT_RETRY_DELAY_MS = 16;

interface UseInitialDestinationMeasurementParams {
	sharedBoundTag: string;
	enabled: boolean;
	currentScreenKey: string;
	preferredSourceScreenKey?: string;
	measureBoundary: (options: MeasureParams) => void;
}

export const useInitialDestinationMeasurement = ({
	sharedBoundTag,
	enabled,
	currentScreenKey,
	preferredSourceScreenKey,
	measureBoundary,
}: UseInitialDestinationMeasurementParams) => {
	const progress = AnimationStore.getValue(currentScreenKey, "progress");
	const system = SystemStore.getBag(currentScreenKey);
	const { pendingLifecycleRequestKind } = system;
	const { blockLifecycleStart, unblockLifecycleStart } = system.actions;
	const isBlockingLifecycleStart = useSharedValue(0);
	const retryToken = useSharedValue(0);

	const ensureLifecycleStartBlocked = () => {
		"worklet";
		if (isBlockingLifecycleStart.get()) {
			return;
		}

		blockLifecycleStart();
		isBlockingLifecycleStart.set(1);
	};

	const releaseLifecycleStartBlock = () => {
		"worklet";
		cancelAnimation(retryToken);

		if (!isBlockingLifecycleStart.get()) {
			return;
		}

		unblockLifecycleStart();
		isBlockingLifecycleStart.set(0);
	};

	const scheduleViewportRetry = () => {
		"worklet";
		cancelAnimation(retryToken);
		retryToken.set(
			withDelay(
				VIEWPORT_RETRY_DELAY_MS,
				withTiming(retryToken.get() + 1, { duration: 0 }),
			),
		);
	};

	useAnimatedReaction(
		() => {
			"worklet";
			const retryTick = retryToken.get();

			const hasPendingOpenRequest =
				pendingLifecycleRequestKind.get() ===
				LifecycleTransitionRequestKind.Open;

			const isWaitingForOpenToStart = progress.get() <= 0;

			if (!hasPendingOpenRequest || !isWaitingForOpenToStart) {
				return [0, retryTick] as const;
			}

			const linkContext = createLinkContext({
				sharedBoundTag,
				currentScreenKey,
				preferredSourceScreenKey,
			});

			const shouldBlock = shouldBlockInitialDestinationMeasurement({
				enabled,
				hasDestinationLink: linkContext.hasDestinationLink,
				hasAttachableSourceLink: linkContext.hasAttachableSourceLink,
			});

			if (!shouldBlock) {
				return [0, retryTick] as const;
			}

			return [1, retryTick] as const;
		},
		([shouldBlock]) => {
			"worklet";
			if (!shouldBlock) {
				releaseLifecycleStartBlock();
				return;
			}

			ensureLifecycleStartBlocked();
			measureBoundary({ intent: "complete-destination" });

			if (hasDestinationLink(sharedBoundTag, currentScreenKey)) {
				releaseLifecycleStartBlock();
				return;
			}

			scheduleViewportRetry();
		},
	);
};
