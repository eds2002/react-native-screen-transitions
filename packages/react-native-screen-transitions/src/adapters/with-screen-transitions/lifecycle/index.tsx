import { useScreenLifecycle } from "../../../navigators/blank-stack/components/lifecycle/use-screen-lifecycle";
import { useBuilderStore } from "../../../providers/builder";
import { useNativeCloseTransitionIntent } from "./use-native-close-transition-intent";

export function NativeStackLifecycle() {
	const current = useBuilderStore((store) => store.descriptors.current);

	const { completeClose } = useNativeCloseTransitionIntent(current);

	useScreenLifecycle({ completeClose });

	return null;
}
