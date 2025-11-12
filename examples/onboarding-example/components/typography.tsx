import { Text } from "react-native";

export const Typography = {
	Heading: ({ children }: { children: React.ReactNode }) => {
		return (
			<Text
				style={{
					fontSize: 32,
					fontWeight: "600",
					lineHeight: 36,
				}}
			>
				{children}
			</Text>
		);
	},
	Subtitle: ({ children }: { children: React.ReactNode }) => {
		return (
			<Text
				style={{
					fontSize: 16,
					fontWeight: "400",
					lineHeight: 24,
					opacity: 0.75,
				}}
			>
				{children}
			</Text>
		);
	},
};
