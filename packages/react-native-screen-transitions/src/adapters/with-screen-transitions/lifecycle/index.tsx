import { useScreenHistory } from "../../../navigators/kit/components/lifecycle/hooks/history/use-screen-history";
import { useBuilderStore } from "../../../providers/builder";
import { useMotionLifecycle } from "../../../providers/motion/lifecycle/use-motion-lifecycle";
import { useNativeCloseTransitionIntent } from "./use-native-close-transition-intent";

export function NativeStackLifecycle() {
	const current = useBuilderStore((store) => store.descriptors.current);
	const previous = useBuilderStore((store) => store.descriptors.previous);

	const { completeClose } = useNativeCloseTransitionIntent(current);

	const { values } = useMotionLifecycle({ onClose: completeClose });
	useScreenHistory(current, previous, values);

	return null;
}
