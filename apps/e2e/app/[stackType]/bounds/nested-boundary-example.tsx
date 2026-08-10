import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

const BOUNDARY_GROUP = "nested-stack-group";

const BOUNDARY_ITEMS = [
	{ id: "violet", label: "Violet", color: "#7C3AED" },
	{ id: "coral", label: "Coral", color: "#F43F5E" },
	{ id: "cyan", label: "Cyan", color: "#0891B2" },
] as const;

type ExampleParams = {
	groups?: string;
	id?: string;
	targetBound?: string;
};

type NestedBoundaryMeta = {
	nestedBoundaryGroups?: string;
	nestedBoundaryId?: string;
	nestedBoundaryTargetBound?: string;
};

type NestedBoundaryNavigation = {
	getParent: () => NestedBoundaryNavigation | undefined;
	setOptions: (options: { meta: NestedBoundaryMeta }) => void;
};

const isEnabled = (value: unknown) => value === "true";

const getRouteParam = (route: { params?: object } | undefined, key: string) => {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	return params?.[key];
};

export const nestedBoundaryZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ active, bounds, current, next, previous }) => {
		"worklet";
		const groups =
			active.meta?.nestedBoundaryGroups ??
			next?.meta?.nestedBoundaryGroups ??
			current.meta?.nestedBoundaryGroups ??
			previous?.meta?.nestedBoundaryGroups ??
			getRouteParam(active.route, "groups") ??
			getRouteParam(next?.route, "groups") ??
			getRouteParam(current.route, "groups") ??
			getRouteParam(previous?.route, "groups");
		const targetBoundParam =
			active.meta?.nestedBoundaryTargetBound ??
			next?.meta?.nestedBoundaryTargetBound ??
			current.meta?.nestedBoundaryTargetBound ??
			previous?.meta?.nestedBoundaryTargetBound ??
			getRouteParam(active.route, "targetBound") ??
			getRouteParam(next?.route, "targetBound") ??
			getRouteParam(current.route, "targetBound") ??
			getRouteParam(previous?.route, "targetBound");
		const idParam =
			active.meta?.nestedBoundaryId ??
			next?.meta?.nestedBoundaryId ??
			current.meta?.nestedBoundaryId ??
			previous?.meta?.nestedBoundaryId ??
			getRouteParam(active.route, "id") ??
			getRouteParam(next?.route, "id") ??
			getRouteParam(current.route, "id") ??
			getRouteParam(previous?.route, "id");
		const id = typeof idParam === "string" ? idParam : "violet";
		const group = groups === "true" ? BOUNDARY_GROUP : undefined;
		const targetBound = targetBoundParam === "true";
		const boundary = bounds({ id, group });

		return targetBound
			? boundary.navigation.zoom({ target: "bound" })
			: boundary.navigation.zoom();
	};

type ToggleRowProps = {
	label: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
	testID: string;
};

function ToggleRow({ label, value, onValueChange, testID }: ToggleRowProps) {
	const theme = useTheme();

	return (
		<View style={[styles.toggleRow, { backgroundColor: theme.card }]}>
			<Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
			<Switch testID={testID} value={value} onValueChange={onValueChange} />
		</View>
	);
}

export function NestedBoundarySource({
	destination,
	title,
}: {
	destination: string;
	title: string;
}) {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const navigation = useNavigation() as NestedBoundaryNavigation;
	const [groups, setGroups] = useState(true);
	const [targetBound, setTargetBound] = useState(true);
	const [escapeClipping, setEscapeClipping] = useState(true);

	const openDestination = (id: string) => {
		navigation.setOptions({
			meta: {
				nestedBoundaryGroups: String(groups),
				nestedBoundaryId: id,
				nestedBoundaryTargetBound: String(targetBound),
			},
		});
		router.push({
			pathname: buildStackPath(stackType, destination) as never,
			params: {
				groups: String(groups),
				id,
				targetBound: String(targetBound),
			},
		});
	};

	return (
		<SafeAreaView
			style={[styles.screen, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title={title}
				subtitle="Open a card, retarget it there, then dismiss"
			/>
			<View style={styles.content}>
				<View style={styles.toggles}>
					<ToggleRow
						label="Groups"
						value={groups}
						onValueChange={setGroups}
						testID="nested-boundary-toggle-groups"
					/>
					<ToggleRow
						label='target: "bound"'
						value={targetBound}
						onValueChange={setTargetBound}
						testID="nested-boundary-toggle-target-bound"
					/>
					<ToggleRow
						label="escapeClipping"
						value={escapeClipping}
						onValueChange={setEscapeClipping}
						testID="nested-boundary-toggle-escape-clipping"
					/>
				</View>

				<View style={styles.sourceCards}>
					{BOUNDARY_ITEMS.map((item, index) => (
						<View
							key={item.id}
							style={[
								styles.sourceCardContainer,
								index === 0
									? styles.sourceCard1
									: index === 1
										? styles.sourceCard2
										: styles.sourceCard3,
							]}
						>
							<Transition.Boundary.Trigger
								id={item.id}
								group={groups ? BOUNDARY_GROUP : undefined}
								escapeClipping={escapeClipping}
								style={[styles.sourceCard, { backgroundColor: item.color }]}
								testID={`nested-boundary-source-${item.id}`}
								onPress={() => openDestination(item.id)}
							>
								<Text style={styles.cardEyebrow}>SOURCE</Text>
								<Text style={styles.sourceCardTitle}>{item.label}</Text>
							</Transition.Boundary.Trigger>
						</View>
					))}
				</View>
			</View>
		</SafeAreaView>
	);
}

export function NestedBoundaryDestination({
	title,
	updateParentRoute = false,
}: {
	title: string;
	updateParentRoute?: boolean | number;
}) {
	const theme = useTheme();
	const params = useLocalSearchParams<ExampleParams>();
	const navigation = useNavigation() as NestedBoundaryNavigation;
	const groups = isEnabled(params.groups);
	const activeItem =
		BOUNDARY_ITEMS.find((item) => item.id === params.id) ?? BOUNDARY_ITEMS[0];
	const selectBoundary = (id: string) => {
		router.setParams({ id });
		if (updateParentRoute) {
			const parentRouteDepth =
				typeof updateParentRoute === "number" ? updateParentRoute : 1;
			let parentNavigation: NestedBoundaryNavigation | undefined = navigation;
			for (let depth = 0; depth < parentRouteDepth; depth++) {
				parentNavigation = parentNavigation?.getParent();
			}
			parentNavigation?.setOptions({
				meta: { nestedBoundaryId: id },
			});
		}
	};

	return (
		<SafeAreaView
			style={[styles.screen, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader title={title} subtitle="Change the ID, then swipe back" />
			<View style={styles.destinationContent}>
				<Transition.Boundary.View
					id={activeItem.id}
					group={groups ? BOUNDARY_GROUP : undefined}
					style={[
						styles.destinationCard,
						{ backgroundColor: activeItem.color },
					]}
					testID="nested-boundary-destination"
				>
					<Text style={styles.cardEyebrow}>DESTINATION</Text>
					<Text style={styles.cardTitle}>{activeItem.label}</Text>
				</Transition.Boundary.View>
				<View style={styles.idControls}>
					{BOUNDARY_ITEMS.map((item) => {
						const active = item.id === activeItem.id;
						return (
							<Pressable
								key={item.id}
								testID={`nested-boundary-select-${item.id}`}
								style={[
									styles.idControl,
									{ backgroundColor: active ? item.color : theme.card },
								]}
								onPress={() => selectBoundary(item.id)}
							>
								<Text style={{ color: active ? "#FFFFFF" : theme.text }}>
									{item.label}
								</Text>
							</Pressable>
						);
					})}
				</View>
				<Text style={[styles.summary, { color: theme.textSecondary }]}>
					Groups: {groups ? "on" : "off"} · target bound:{" "}
					{isEnabled(params.targetBound) ? "on" : "off"} · dismisses to:{" "}
					{activeItem.label}
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	content: { flex: 1, padding: 16, gap: 28 },
	destinationContent: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
		gap: 24,
	},
	toggles: { gap: 10 },
	toggleRow: {
		minHeight: 54,
		borderRadius: 16,
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	toggleLabel: { fontSize: 16, fontWeight: "600" },
	sourceCards: { flex: 1, gap: 12 },
	sourceCardContainer: {
		height: 92,
	},
	sourceCard: {
		height: "100%",
		width: "100%",
		borderRadius: 28,
		padding: 18,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	sourceCard1: { width: "46%" },
	sourceCard2: { width: "58%", alignSelf: "flex-end" },
	sourceCard3: { width: "72%", alignSelf: "center" },
	sourceCardTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
	destinationCard: {
		height: 280,
		width: "100%",
		borderRadius: 36,
		backgroundColor: "#7C3AED",
		padding: 24,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	cardEyebrow: {
		color: "rgba(255,255,255,0.72)",
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.2,
	},
	cardTitle: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "800",
		marginTop: 4,
	},
	idControls: { flexDirection: "row", gap: 8 },
	idControl: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 12,
		borderRadius: 14,
	},
	summary: { fontSize: 14, lineHeight: 21, textAlign: "center" },
});
