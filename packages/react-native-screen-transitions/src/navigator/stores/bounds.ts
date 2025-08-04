import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { ScreenKey } from "../../types/navigator";
import type { Any } from "../../types/utils";

type BoundsDict = Record<
	string,
	Record<string, { bounds: MeasuredDimensions; styles: StyleProps }>
>;

const registry = makeMutable<BoundsDict>({});
const activeBoundId = makeMutable<string | null>(null);

function setBounds(
	screenId: string,
	boundId: string,
	bounds: MeasuredDimensions | null = null,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[screenId]) {
			state[screenId] = {};
		}
		if (!state[screenId][boundId]) {
			state[screenId][boundId] = { bounds, styles };
		}

		return state;
	});
}

function getBounds(screenId: string) {
	"worklet";
	return registry.value[screenId] ?? {};
}

function setActiveBoundId(boundId: string) {
	"worklet";
	activeBoundId.value = boundId;
}

function getActiveBoundId() {
	"worklet";
	return activeBoundId.value;
}

function clear(routeKey: ScreenKey) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		delete state[routeKey];
		return state;
	});
}

export const Bounds = {
	setBounds,
	getBounds,
	setActiveBoundId,
	getActiveBoundId,
	clear,
};
