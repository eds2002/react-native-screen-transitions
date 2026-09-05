import { useBuilderStore } from "./builder";
import { useScreenRelationships } from "./builder/topology";

export const useCurrentScreenRelationships = () => {
	const screenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);

	return useScreenRelationships(screenKey);
};
