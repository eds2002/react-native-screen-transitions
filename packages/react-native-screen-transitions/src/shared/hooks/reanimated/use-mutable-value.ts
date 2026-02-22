import { useState } from "react";
import { makeMutable } from "react-native-reanimated";

export function useMutableValue<T>(initialValue: T) {
	return useState(() => makeMutable(initialValue))[0];
}
