import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ActionButton, DemoScreen, InfoCard } from "@/components/ui";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

type NestedExampleAction = {
	label: string;
	onPress: () => void;
	variant?: "primary" | "secondary";
	testID?: string;
};

type NestedExampleScreenProps = {
	title: string;
	subtitle: string;
	stackLabel: string;
	routeLabel: string;
	description: string;
	tint: string;
	actions: NestedExampleAction[];
	notes: string[];
};

export function useNestedExamplePaths() {
	const stackType = useResolvedStackType();

	return {
		stackHome: buildStackPath(stackType),
		outerA: buildStackPath(stackType, "nested/a"),
		outerB: buildStackPath(stackType, "nested/b"),
		innerA: buildStackPath(stackType, "nested/nested-b/a"),
		innerB: buildStackPath(stackType, "nested/nested-b/b"),
	};
}

export function NestedExampleScreen({
	title,
	subtitle,
	stackLabel,
	routeLabel,
	description,
	tint,
	actions,
	notes,
}: NestedExampleScreenProps) {
	const theme = useTheme();

	return (
		<DemoScreen tint={tint}>
			<ScreenHeader title={title} subtitle={subtitle} light />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.hero}>
					<Text style={styles.stackLabel}>{stackLabel}</Text>
					<Text style={styles.routeLabel}>{routeLabel}</Text>
					<Text style={styles.description}>{description}</Text>
				</View>

				<InfoCard
					title="What to inspect"
					style={{
						borderWidth: StyleSheet.hairlineWidth,
						backgroundColor: theme.infoBox,
						borderColor: theme.infoBorder,
					}}
				>
					{notes.map((note) => (
						<Text key={note} style={[styles.note, { color: theme.textSecondary }]}>
							{"\u2022"} {note}
						</Text>
					))}
				</InfoCard>

				<View style={styles.actions}>
					{actions.map((action) => (
						<ActionButton
							key={action.label}
							title={action.label}
							onPress={action.onPress}
							variant={action.variant}
							testID={action.testID}
						/>
					))}
				</View>
			</ScrollView>
		</DemoScreen>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 16,
		gap: 16,
	},
	hero: {
		borderRadius: 24,
		padding: 20,
		backgroundColor: "rgba(255,255,255,0.1)",
		gap: 8,
	},
	stackLabel: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "rgba(255,255,255,0.8)",
	},
	routeLabel: {
		fontSize: 28,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		color: "rgba(255,255,255,0.84)",
	},
	note: {
		fontSize: 14,
		lineHeight: 21,
	},
	actions: {
		gap: 12,
	},
});
