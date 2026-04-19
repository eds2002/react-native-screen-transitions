import { StyleSheet, Text } from "react-native";
import { useTheme } from "@/theme";

interface SectionLabelProps {
	title: string;
}

export function SectionLabel({ title }: SectionLabelProps) {
	const theme = useTheme();

	return (
		<Text style={[styles.label, { color: theme.textTertiary }]}>{title}</Text>
	);
}

const styles = StyleSheet.create({
	label: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
});
