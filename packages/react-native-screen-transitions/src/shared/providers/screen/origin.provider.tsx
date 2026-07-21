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

export const { OriginProvider, useOriginContext } = createProvider("Origin", {
	guarded: true,
})<Props, ContextValue>(({ children }) => {
	const originRef = useAnimatedRef<View>();

	return {
		value: {
			originRef,
		},
		children: (
			<Animated.View
				style={styles.container}
				collapsable={false}
				ref={originRef}
			>
				{children}
			</Animated.View>
		),
	};
});

const styles = StyleSheet.create({
	container: { flex: 1 },
});
