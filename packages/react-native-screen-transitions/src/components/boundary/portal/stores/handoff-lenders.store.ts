import { makeMutable } from "react-native-reanimated";
import { hasAnyKeys } from "../../../../utils/has-any-keys";

/**
 * Screens whose handoff content is presented in another screen right now (and the screens they are
 * nested in), by boundary. The content's native views still belong to the lending screen: hiding
 * or pausing that screen (an inactive screen under two others) would take the content away from
 * the screen showing it, so the navigator keeps a lending screen as it is.
 */
export const handoffLenders = makeMutable<Record<string, Record<string, true>>>(
	{},
);

export const setHandoffLending = (
	screenKeys: readonly string[],
	boundaryKey: string,
	lending: boolean,
) => {
	"worklet";
	const current = handoffLenders.get();
	let changed = false;
	for (const key of screenKeys) {
		if (!!current[key]?.[boundaryKey] !== lending) {
			changed = true;
			break;
		}
	}
	if (!changed) return;
	handoffLenders.modify((state) => {
		"worklet";
		for (const key of screenKeys) {
			if (lending) {
				if (!state[key]) state[key] = {};
				state[key][boundaryKey] = true;
				continue;
			}
			const boundaries = state[key];
			if (!boundaries) continue;
			delete boundaries[boundaryKey];
			if (!hasAnyKeys(boundaries)) delete state[key];
		}
		return state;
	});
};
