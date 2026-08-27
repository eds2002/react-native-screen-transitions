import { useScreenRelationships } from "../../factories/screen-topology";
import { useDescriptorsStore } from "./descriptors";

export const useCurrentScreenRelationships = () => {
	const screenKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);

	return useScreenRelationships(screenKey);
};
