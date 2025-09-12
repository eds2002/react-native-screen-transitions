import { reanimatedVersion } from "react-native-reanimated";

export const isReanimated4 = () => {
	return reanimatedVersion.split(".")[0] === "4";
};
