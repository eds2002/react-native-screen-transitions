import { useCallback, useLayoutEffect } from "react";
import { StyleSheet, type View } from "react-native";
import Animated, {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	runOnUI,
	type SharedValue,
	useAnimatedRef,
	useSharedValue,
} from "react-native-reanimated";
import createProvider from "../../utils/create-provider";

interface Props {
	children: React.ReactNode;
}
interface ContextValue {
	originDimensions: SharedValue<MeasuredDimensions | null>;
	originRef: AnimatedRef<View>;
}

export const { OriginProvider, useOriginContext } = createProvider("Origin", {
	guarded: true,
})<Props, ContextValue>(({ children }) => {
	const originRef = useAnimatedRef<View>();
	const originDimensions = useSharedValue<MeasuredDimensions | null>(null);

	const measureOrigin = useCallback(() => {
		runOnUI(() => {
			const measured = measure(originRef);
			if (!measured) return;
			originDimensions.set(measured);
		})();
	}, [originRef, originDimensions]);

	useLayoutEffect(() => {
		measureOrigin();
	}, [measureOrigin]);

	return {
		value: {
			originDimensions,
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
