import { useAnimatedProps, useAnimatedStyle } from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../../constants";
import { useOrchestratorStore } from "../../orchestrator.store";

export const useSlotStyles = (slotId: string | undefined) => {
	const slotsMap = useOrchestratorStore((store) => store.slotsMap);

	return useAnimatedStyle(() => {
		return (slotId ? slotsMap.get()[slotId]?.style : undefined) ?? NO_STYLES;
	});
};

export const useSlotProps = (slotId: string | undefined) => {
	const slotsMap = useOrchestratorStore((store) => store.slotsMap);

	return useAnimatedProps(() => {
		return ((slotId ? slotsMap.get()[slotId]?.props : undefined) ??
			NO_PROPS) as any;
	}) as any;
};
