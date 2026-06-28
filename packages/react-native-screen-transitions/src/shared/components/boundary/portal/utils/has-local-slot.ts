import type { LocalStyleLayers } from "../../../../providers/screen/styles/helpers/resolve-slot-styles";

export const hasLocalSlot = (
	localStylesMaps: LocalStyleLayers,
	slotId: string,
) => {
	"worklet";

	for (let index = 0; index < localStylesMaps.length; index++) {
		if (localStylesMaps[index]?.[slotId] !== undefined) {
			return true;
		}
	}

	return false;
};
