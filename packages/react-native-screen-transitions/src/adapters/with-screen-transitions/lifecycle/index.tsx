import { useScreenLifecycle } from "../../../components/screen/lifecycle/use-screen-lifecycle";
import { useBuilderStore } from "../../../providers/screen/builder";
import { useNativeCloseTransitionIntent } from "./use-native-close-transition-intent";

export function NativeStackLifecycle() {
	const current = useBuilderStore((store) => store.descriptors.current);

	const { completeClose } = useNativeCloseTransitionIntent(current);

	useScreenLifecycle({ completeClose });

	return null;
}
