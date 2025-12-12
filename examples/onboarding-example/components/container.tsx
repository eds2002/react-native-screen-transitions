import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const Container = ({ children }: { children: React.ReactNode }) => {
	const insets = useSafeAreaInsets();
	return (
		<View
			style={{
				padding: 24,
				paddingTop: insets.top + 64,
				paddingBottom: insets.bottom + 16,
			}}
		>
			{children}
		</View>
	);
};
