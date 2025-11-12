import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import type { TextInput } from "react-native";

export const useFocusInput = () => {
	const ref = useRef<TextInput>(null);

	useFocusEffect(
		useCallback(() => {
			requestAnimationFrame(() => {
				ref.current?.focus();
			});
		}, []),
	);
	return { ref };
};
