import { useDescriptorsStore } from "./descriptors";
import { useScreenRelationships } from "./topology";

export const useCurrentScreenRelationships = () => {
	const screenKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);

	return useScreenRelationships(screenKey);
};
