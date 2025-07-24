import { makeMutable, type SharedValue } from "react-native-reanimated";

let fallbackSharedValue: SharedValue<number> | null = null;
export const getFallbackSharedValue = (): SharedValue<number> => {
	"worklet";
	if (!fallbackSharedValue) {
		fallbackSharedValue = makeMutable(0);
	}
	return fallbackSharedValue;
};
