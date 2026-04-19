import { router, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
	Easing,
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	buildBenchmarkPath,
	useResolvedBenchmarkImpl,
	useResolvedBenchmarkScenario,
} from "@/components/benchmark/impl-routing";
import { getBenchmarkDefinition } from "@/components/benchmark/scenarios";
import { useBenchmarkStore } from "@/components/benchmark/store";
import { useTheme } from "@/theme";

const NAVIGATE_DURING_CLOSE_DELAY_MS = 8;

const getParamValue = (
	value: string | string[] | undefined,
): string | undefined => {
	if (!value) return undefined;
	return Array.isArray(value) ? value[0] : value;
};

export default function BenchmarkRunScreen() {
	const impl = useResolvedBenchmarkImpl();
	const scenario = useResolvedBenchmarkScenario();
	const navigation = useNavigation();
	const theme = useTheme();
	const definition = getBenchmarkDefinition(scenario);
	const params = useLocalSearchParams<{
		runId?: string | string[];
		cycle?: string | string[];
	}>();

	const hasExecutedRef = useRef(false);
	const pulse = useSharedValue(0);

	const runId = getParamValue(params.runId);
	const cycleRaw = getParamValue(params.cycle);
	const cycle = Number(cycleRaw);
	const isTransparentSurface = definition.appearance !== "opaque-card";
	const isModalSurface = definition.appearance === "modal-sheet";
	const holdBeforePopMs = definition.holdBeforePopMs;
	const title = isModalSurface
		? "Running Modal Benchmark Cycle"
		: "Running Benchmark Cycle";

	useEffect(() => {
		cancelAnimation(pulse);
		pulse.value = 0;
		pulse.value = withRepeat(
			withTiming(1, {
				duration: 1050,
				easing: Easing.inOut(Easing.cubic),
			}),
			-1,
			true,
		);
		return () => {
			cancelAnimation(pulse);
		};
	}, [pulse]);

	const pulseStyle = useAnimatedStyle(() => ({
		transform: [{ scaleX: 0.4 + pulse.value * 0.6 }],
		opacity: 0.35 + pulse.value * 0.65,
	}));

	useEffect(() => {
		if (hasExecutedRef.current) return;

		const goBackToController = () => {
			if (navigation.canGoBack()) {
				navigation.goBack();
				return;
			}
			const basePath = buildBenchmarkPath(impl);
			router.replace(`${basePath}?scenario=${scenario}` as never);
		};

		if (!runId || !Number.isFinite(cycle) || cycle <= 0) {
			goBackToController();
			return;
		}

		let disposed = false;
		let waitFrameHandle: number | null = null;
		let popTimeout: ReturnType<typeof setTimeout> | null = null;
		let navigateTimeout: ReturnType<typeof setTimeout> | null = null;

		const step = () => {
			if (disposed || hasExecutedRef.current) return;

			const { activeRun, recordRunMounted } = useBenchmarkStore.getState();
			if (!activeRun) {
				waitFrameHandle = requestAnimationFrame(step);
				return;
			}

			if (
				activeRun.id !== runId ||
				activeRun.impl !== impl ||
				activeRun.scenario !== scenario
			) {
				goBackToController();
				return;
			}

			hasExecutedRef.current = true;
			recordRunMounted(runId, cycle, performance.now());

			popTimeout = setTimeout(() => {
				const { activeRun: latestRun, recordPopDispatch } =
					useBenchmarkStore.getState();
				if (
					!latestRun ||
					latestRun.id !== runId ||
					latestRun.impl !== impl ||
					latestRun.scenario !== scenario
				) {
					return;
				}

				recordPopDispatch(runId, cycle, performance.now());
				goBackToController();

				if (scenario === "navigate-during-close") {
					navigateTimeout = setTimeout(() => {
						const targetPath = buildBenchmarkPath(
							impl,
							`navigate-target?runId=${encodeURIComponent(runId)}&cycle=${cycle}&scenario=${scenario}`,
						);
						router.navigate(targetPath as never);
					}, NAVIGATE_DURING_CLOSE_DELAY_MS);
				}
			}, holdBeforePopMs);
		};

		step();

		return () => {
			disposed = true;
			if (waitFrameHandle !== null) cancelAnimationFrame(waitFrameHandle);
			if (popTimeout !== null) clearTimeout(popTimeout);
			if (navigateTimeout !== null) clearTimeout(navigateTimeout);
		};
	}, [cycle, holdBeforePopMs, impl, navigation, runId, scenario]);

	return (
		<SafeAreaView
			style={[
				styles.container,
				{
					backgroundColor: isTransparentSurface ? "transparent" : theme.bg,
				},
			]}
			edges={["top", "bottom"]}
		>
			{isTransparentSurface ? (
				<View
					pointerEvents="none"
					style={[
						styles.backdrop,
						{
							backgroundColor: isModalSurface
								? "rgba(15, 23, 42, 0.18)"
								: "rgba(15, 23, 42, 0.12)",
						},
					]}
				/>
			) : null}
			<View
				style={[
					styles.surfaceWrapper,
					isModalSurface
						? styles.modalWrapper
						: isTransparentSurface
							? styles.centerWrapper
							: null,
				]}
			>
				<View
					style={[
						styles.surface,
						isModalSurface
							? styles.modalSurface
							: isTransparentSurface
								? styles.transparentSurface
								: styles.opaqueSurface,
						{
							backgroundColor: isTransparentSurface
								? theme.card
								: theme.bg,
							borderColor: theme.separator,
						},
					]}
				>
					{isModalSurface ? (
						<View
							style={[
								styles.modalHandle,
								{ backgroundColor: theme.separator },
							]}
						/>
					) : null}
					<ActivityIndicator size="small" color={theme.text} />
					<Text style={[styles.title, { color: theme.text }]}>{title}</Text>
					<Text style={[styles.detail, { color: theme.textTertiary }]}>
						{definition.title} • {impl} • cycle{" "}
						{Number.isFinite(cycle) ? cycle : "-"}
					</Text>
					<View
						style={[
							styles.track,
							{
								backgroundColor: isTransparentSurface
									? theme.surface
									: theme.surfaceElevated,
							},
						]}
					>
						<Animated.View
							style={[
								styles.pulse,
								{ backgroundColor: theme.actionButton },
								pulseStyle,
							]}
						/>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
	},
	surfaceWrapper: {
		flex: 1,
	},
	centerWrapper: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 18,
	},
	modalWrapper: {
		justifyContent: "flex-end",
		paddingHorizontal: 18,
		paddingBottom: 18,
	},
	surface: {
		borderWidth: StyleSheet.hairlineWidth,
	},
	opaqueSurface: {
		flex: 1,
		borderWidth: 0,
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		paddingHorizontal: 28,
	},
	transparentSurface: {
		width: "100%",
		maxWidth: 360,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		paddingHorizontal: 24,
		paddingVertical: 30,
		shadowColor: "#000",
		shadowOpacity: 0.16,
		shadowRadius: 28,
		shadowOffset: {
			width: 0,
			height: 10,
		},
		elevation: 10,
	},
	modalSurface: {
		width: "100%",
		minHeight: 280,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		borderBottomLeftRadius: 18,
		borderBottomRightRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		paddingHorizontal: 24,
		paddingTop: 18,
		paddingBottom: 32,
		shadowColor: "#000",
		shadowOpacity: 0.18,
		shadowRadius: 24,
		shadowOffset: {
			width: 0,
			height: -6,
		},
		elevation: 12,
	},
	modalHandle: {
		width: 44,
		height: 5,
		borderRadius: 999,
		marginBottom: 6,
	},
	title: {
		fontSize: 19,
		fontWeight: "700",
	},
	detail: {
		fontSize: 13,
		textAlign: "center",
	},
	track: {
		marginTop: 6,
		width: 220,
		height: 14,
		borderRadius: 999,
		paddingHorizontal: 6,
		justifyContent: "center",
	},
	pulse: {
		height: 6,
		borderRadius: 999,
	},
});
