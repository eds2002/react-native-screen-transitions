import type React from "react";
import { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

interface CodeProps {
	children: string;
	showLineNumbers?: boolean;
	style?: any;
	inline?: boolean;
}

export function Code({
	children,
	showLineNumbers = false,
	style,
	inline = false,
}: CodeProps) {
	const safeText = typeof children === "string" ? children : "";

	const lines = useMemo(() => safeText.split("\n"), [safeText]);
	const maxLineNumberChars = useMemo(
		() => String(lines.length).length,
		[lines.length],
	);

	if (inline) {
		return <Text style={[styles.inlineCode, style]}>{safeText}</Text>;
	}

	return (
		<View style={[styles.container, style]}>
			<View style={styles.body}>
				{lines.map((line, index) => (
					<View key={index.toString()} style={styles.lineContainer}>
						{showLineNumbers && (
							<Text style={styles.lineNumber}>
								{String(index + 1).padStart(maxLineNumberChars, " ")}
							</Text>
						)}
						<Text style={styles.codeText}>
							{line.length === 0 ? " " : line}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}

const monoFont =
	Platform.select({
		ios: "Courier",
		android: "monospace",
		default: "Courier New",
	}) ?? "Courier New";

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#f1f5f9",
		borderRadius: 24,
		overflow: "hidden",
		marginVertical: 8,
		width: "100%",
	},
	body: {
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	lineContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	lineNumber: {
		color: "#888",
		fontSize: 12,
		lineHeight: 16,
		fontFamily: monoFont,
		marginRight: 12,
		textAlign: "right",
	},
	codeText: {
		color: "#000",
		fontSize: 13,
		lineHeight: 16,
		fontFamily: monoFont,
		flex: 1,
	},
	inlineCode: {
		color: "#000",
		fontWeight: "600",
		opacity: 0.7,
	},
});
