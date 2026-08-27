import { useWindowDimensions } from "react-native";
import {
	type SharedValue,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { SystemStore } from "../../../../stores/system.store";
import { getVisibilityBlockOffset } from "../../../../utils/visibility-block-offset";
import { useDescriptorsStore } from "../../descriptors";
import { hasCloseTransitionFinished } from "../helpers/transition-visual-state";
import { resolveVisibilityBlockOwnership } from "../helpers/visibility-block-ownership";
import { resolveScreenVisibilityGate } from "../helpers/visibility-gate";

type Params = {
	ancestorVisibilityBlocked: SharedValue<boolean> | null;
	isFloatingOverlay?: boolean;
};

export const useMaybeBlockVisibility = ({
	ancestorVisibilityBlocked,
	isFloatingOverlay,
}: Params) => {
	const { height } = useWindowDimensions();
	const currentScreenKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);
	const { closing, entering } = AnimationStore.getBag(currentScreenKey);
	const {
		animationProgress,
		pendingLifecycleStartBlockCount,
		pendingLifecycleRequestKind,
	} = SystemStore.getBag(currentScreenKey);

	const hasVisibilityGateOpened = useSharedValue(false);
	const localVisibilityBlocked = useSharedValue(!isFloatingOverlay);
	const effectiveVisibilityBlocked = useSharedValue(!isFloatingOverlay);

	useAnimatedReaction(
		() => {
			"worklet";

			return {
				gate: resolveScreenVisibilityGate({
					isFloatingOverlay,
					hasVisibilityGateOpened: hasVisibilityGateOpened.get(),
					pendingLifecycleStartBlockCount:
						pendingLifecycleStartBlockCount.get(),
					pendingLifecycleRequestKind: pendingLifecycleRequestKind.get(),
					animationProgress: animationProgress.get(),
					entering: entering.get(),
				}),
				ancestorBlocked: ancestorVisibilityBlocked?.get() ?? false,
			};
		},
		({ gate, ancestorBlocked }) => {
			"worklet";

			if (gate.shouldOpenGate) {
				hasVisibilityGateOpened.set(true);
			}

			const ownership = resolveVisibilityBlockOwnership({
				localBlocked: gate.shouldBlock,
				ancestorBlocked,
			});
			localVisibilityBlocked.set(gate.shouldBlock);
			effectiveVisibilityBlocked.set(ownership.effectiveBlocked);
		},
	);

	const animatedStyle = useAnimatedStyle(() => {
		"worklet";
		const offset = getVisibilityBlockOffset(height);
		// Hide the outgoing screen after its visual close while React removes its
		// host asynchronously.
		const shouldHideClosedScreen = hasCloseTransitionFinished({
			closing: closing.get(),
			animationProgress: animationProgress.get(),
		});
		if (shouldHideClosedScreen) {
			return {
				opacity: 0,
			};
		}

		const ownership = resolveVisibilityBlockOwnership({
			localBlocked: localVisibilityBlocked.get(),
			ancestorBlocked: ancestorVisibilityBlocked?.get() ?? false,
		});

		return {
			transform: [
				{
					translateY: ownership.appliesOffset ? offset : 0,
				},
			],
		};
	});

	const animatedProps = useAnimatedProps(() => {
		"worklet";
		return {
			pointerEvents: effectiveVisibilityBlocked.get()
				? ("none" as const)
				: ("box-none" as const),
		};
	});

	return {
		animatedStyle,
		animatedProps,
		visibilityBlocked: effectiveVisibilityBlocked,
	};
};
