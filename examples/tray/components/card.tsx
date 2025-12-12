import { Pressable, Text } from "react-native";

export const Card = ({
	title,
	description,
	onPress,
	variant = "default",
}: {
	title: string;
	description: string;
	onPress?: () => void;
	variant?: "default" | "success" | "error";
}) => {
	const getColors = () => {
		switch (variant) {
			case "success":
				return {
					backgroundColor: "#e0f2fe",
					borderColor: "#bae6fd",
				};
			case "error":
				return {
					backgroundColor: "#fee2e2",
					borderColor: "#fecaca",
				};
			case "default":
			default:
				return {
					backgroundColor: "#f5f5f5",
					borderColor: "#f5f5f5",
				};
		}
	};

	const colors = getColors();

	return (
		<Pressable
			style={{
				padding: 16,
				borderRadius: 24,
				backgroundColor: colors.backgroundColor,
				borderWidth: 2,
				borderColor: colors.borderColor,
				gap: 2,
			}}
			onPress={onPress}
		>
			<Text style={{ fontSize: 16, fontWeight: "600" }}>{title}</Text>
			<Text style={{ fontSize: 14, fontWeight: "500", opacity: 0.5 }}>
				{description}
			</Text>
		</Pressable>
	);
};
