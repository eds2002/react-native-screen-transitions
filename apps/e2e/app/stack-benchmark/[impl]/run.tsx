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
import { BENCHMARK_TRANSITION_DURATION_MS } from "@/components/benchmark/constants";
import {
	buildBenchmarkPath,
	useResolvedBenchmarkImpl,
	useResolvedBenchmarkScenario,
} from "@/components/benchmark/impl-routing";
import { useBenchmarkStore } from "@/components/benchmark/store";

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
	const params = useLocalSearchParams<{
		runId?: string | string[];
		cycle?: string | string[];
	}>();

	const hasExecutedRef = useRef(false);
	const pulse = useSharedValue(0);

	const runId = getParamValue(params.runId);
	const cycleRaw = getParamValue(params.cycle);
	const cycle = Number(cycleRaw);

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
		let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

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

				fallbackTimeout = setTimeout(() => {
					const basePath = buildBenchmarkPath(impl);
					router.replace(`${basePath}?scenario=${scenario}` as never);
				}, BENCHMARK_TRANSITION_DURATION_MS + 140);
			}, 0);
		};

		step();

		return () => {
			disposed = true;
			if (waitFrameHandle !== null) cancelAnimationFrame(waitFrameHandle);
			if (popTimeout !== null) clearTimeout(popTimeout);
			if (navigateTimeout !== null) clearTimeout(navigateTimeout);
			if (fallbackTimeout !== null) clearTimeout(fallbackTimeout);
		};
	}, [cycle, impl, navigation, runId, scenario]);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.content}>
				<ActivityIndicator size="small" color="#fff" />
				<Text style={styles.title}>Running Benchmark Cycle</Text>
				<Text style={styles.detail}>
					{impl} • {scenario} • cycle {Number.isFinite(cycle) ? cycle : "-"}
				</Text>
				<View style={styles.track}>
					<Animated.View style={[styles.pulse, pulseStyle]} />
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0b1220",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		paddingHorizontal: 28,
	},
	title: {
		fontSize: 19,
		fontWeight: "700",
		color: "#e2e8f0",
	},
	detail: {
		fontSize: 13,
		color: "#94a3b8",
		textAlign: "center",
	},
	track: {
		marginTop: 6,
		width: 220,
		height: 14,
		borderRadius: 999,
		backgroundColor: "rgba(15,23,42,0.95)",
		borderWidth: 1,
		borderColor: "rgba(100,116,139,0.5)",
		paddingHorizontal: 6,
		justifyContent: "center",
	},
	pulse: {
		height: 6,
		borderRadius: 999,
		backgroundColor: "#38bdf8",
	},
});
