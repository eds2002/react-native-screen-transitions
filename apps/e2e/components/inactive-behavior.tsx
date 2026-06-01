import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { InactiveBehavior } from "react-native-screen-transitions/blank-stack";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ActionButton, DemoScreen, InfoCard } from "@/components/ui";
import { useTheme } from "@/theme";
import { ScreenHeader } from "./screen-header";

type BehaviorOption = {
	id: InactiveBehavior;
	title: string;
	description: string;
	scenario: string;
};

const liveInstances = {
	keep: new Set<number>(),
	freeze: new Set<number>(),
	detach: new Set<number>(),
	unmount: new Set<number>(),
} satisfies Record<InactiveBehavior, Set<number>>;

const createdInstances = {
	keep: 0,
	freeze: 0,
	detach: 0,
	unmount: 0,
} satisfies Record<InactiveBehavior, number>;

let nextInstanceId = 1;

export const INACTIVE_BEHAVIOR_OPTIONS: BehaviorOption[] = [
	{
		id: "keep",
		title: "Keep",
		description: "Mounted, attached, and visible while inactive",
		scenario: "Expected: highest retention",
	},
	{
		id: "freeze",
		title: "Freeze",
		description:
			"Mounted and visible, with inactive work suspended where possible",
		scenario: "Expected: preserved paint, lower update pressure",
	},
	{
		id: "detach",
		title: "Detach",
		description:
			"Mounted in React, hidden from native presentation after paint",
		scenario: "Expected: lower native view retention",
	},
	{
		id: "unmount",
		title: "Unmount",
		description: "Inactive route subtree removed after the next screen settles",
		scenario: "Expected: lowest retained subtree count",
	},
];

const getBehaviorLabel = (behavior: InactiveBehavior) =>
	INACTIVE_BEHAVIOR_OPTIONS.find((option) => option.id === behavior)?.title ??
	behavior;

function buildPayload(instanceId: number, depth: number) {
	return Array.from({ length: 36 }, (_, index) => ({
		id: `${instanceId}-${index}`,
		title: `Node ${String(index + 1).padStart(2, "0")}`,
		value: `${depth}.${index + 1}.${instanceId}`,
	}));
}

export function InactiveBehaviorProbe({
	behavior,
}: {
	behavior: InactiveBehavior;
}) {
	const theme = useTheme();
	const stackType = useResolvedStackType();
	const params = useLocalSearchParams<{ depth?: string }>();
	const depth = Number(params.depth ?? "1");
	const renderCount = useRef(0);
	const instanceId = useRef(0);
	const [tick, setTick] = useState(0);
	const [mountedCount, setMountedCount] = useState(
		liveInstances[behavior].size,
	);

	if (instanceId.current === 0) {
		instanceId.current = nextInstanceId;
		nextInstanceId += 1;
		createdInstances[behavior] += 1;
	}

	renderCount.current += 1;

	const payload = useMemo(
		() => buildPayload(instanceId.current, depth),
		[depth],
	);

	useEffect(() => {
		const liveSet = liveInstances[behavior];
		liveSet.add(instanceId.current);
		setMountedCount(liveSet.size);

		const interval = setInterval(() => {
			setTick((value) => value + 1);
			setMountedCount(liveSet.size);
		}, 1000);

		return () => {
			clearInterval(interval);
			liveSet.delete(instanceId.current);
		};
	}, [behavior]);

	const pushNext = () => {
		router.push({
			pathname: buildStackPath(
				stackType,
				`inactive-behavior/${behavior}`,
			) as never,
			params: {
				depth: String(depth + 1),
				instance: String(nextInstanceId),
			},
		});
	};

	const metricItems = [
		["Behavior", getBehaviorLabel(behavior)],
		["Depth", String(depth)],
		["Instance", String(instanceId.current)],
		["Mounted", String(mountedCount)],
		["Created", String(createdInstances[behavior])],
		["Render", String(renderCount.current)],
		["Tick", String(tick)],
	];

	return (
		<DemoScreen>
			<ScreenHeader
				title={`${getBehaviorLabel(behavior)} Retention`}
				subtitle={
					stackType === "blank-stack"
						? "BlankStack inactiveBehavior probe"
						: "Native stack path renders for comparison only"
				}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.actions}>
					<ActionButton
						title="Push Next"
						testID={`inactive-behavior-${behavior}-push-next`}
						onPress={pushNext}
						style={styles.action}
					/>
					<ActionButton
						title="Back"
						testID={`inactive-behavior-${behavior}-back`}
						onPress={() => router.back()}
						variant="secondary"
						style={styles.action}
					/>
				</View>

				<View style={styles.metricsGrid}>
					{metricItems.map(([label, value]) => (
						<View
							key={label}
							style={[styles.metric, { backgroundColor: theme.card }]}
						>
							<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
								{label}
							</Text>
							<Text style={[styles.metricValue, { color: theme.text }]}>
								{value}
							</Text>
						</View>
					))}
				</View>

				<InfoCard title="Retained Payload">
					<View style={styles.payloadGrid}>
						{payload.map((item) => (
							<View
								key={item.id}
								style={[
									styles.payloadCell,
									{
										backgroundColor: theme.surfaceElevated,
										borderColor: theme.separator,
									},
								]}
							>
								<Text style={[styles.payloadTitle, { color: theme.text }]}>
									{item.title}
								</Text>
								<Text
									style={[styles.payloadValue, { color: theme.textSecondary }]}
								>
									{item.value}
								</Text>
							</View>
						))}
					</View>
				</InfoCard>
			</ScrollView>
		</DemoScreen>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 16,
		paddingBottom: 40,
		gap: 16,
	},
	actions: {
		flexDirection: "row",
		gap: 10,
	},
	action: {
		flex: 1,
	},
	metricsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	metric: {
		width: "31.7%",
		minHeight: 72,
		borderRadius: 12,
		padding: 12,
		justifyContent: "space-between",
	},
	metricLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
	},
	metricValue: {
		fontSize: 18,
		fontWeight: "700",
	},
	payloadGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	payloadCell: {
		width: "31.9%",
		aspectRatio: 1.2,
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		padding: 8,
		justifyContent: "space-between",
	},
	payloadTitle: {
		fontSize: 12,
		fontWeight: "700",
	},
	payloadValue: {
		fontSize: 11,
	},
});
