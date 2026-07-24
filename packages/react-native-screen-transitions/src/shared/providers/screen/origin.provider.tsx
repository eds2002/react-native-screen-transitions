import { useMemo } from "react";
import { StyleSheet, type View } from "react-native";
import Animated, {
	type AnimatedRef,
	useAnimatedRef,
} from "react-native-reanimated";
import createProvider from "../../utils/create-provider";

interface Props {
	children: React.ReactNode;
}
interface ContextValue {
	originRef: AnimatedRef<View>;
}

export const { OriginProvider, useOriginStore } = createProvider("Origin", {
	guarded: true,
})<Props, ContextValue>(({ children }) => {
	const originRef = useAnimatedRef<View>();

	const content = useMemo(
		() => (
			<Animated.View
				style={styles.container}
				collapsable={false}
				ref={originRef}
			>
				{children}
			</Animated.View>
		),
		[originRef, children],
	);
	return {
		value: {
			originRef,
		},
		children: content,
	};
});

const styles = StyleSheet.create({
	container: { flex: 1 },
});
