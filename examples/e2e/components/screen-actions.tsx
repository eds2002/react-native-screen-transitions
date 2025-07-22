import { styles } from "@/global.styles";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { View, Text, Button } from "react-native";

export const ScreenActions = ({
	title,
	nextHref,
	canGoBack,
}: {
	title: string | ReactNode;
	nextHref?: string;
	canGoBack?: boolean;
}) => {
	return (
		<View style={{ gap: 4, alignItems: "center", justifyContent: "center" }}>
			{typeof title === "string" ? (
				<Text style={styles.screenTitle} testID="screen-title">
					{title}
				</Text>
			) : (
				title
			)}
			<View style={{ gap: 4, flexDirection: "row" }}>
				{canGoBack && (
					<Button title={"Go back"} onPress={router.back} testID="back" />
				)}
				{nextHref && (
					<Button
						title={"Go next"}
						onPress={() => router.push(nextHref as never)}
						testID="next"
					/>
				)}
			</View>
		</View>
	);
};
