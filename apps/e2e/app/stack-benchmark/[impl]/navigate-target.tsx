import { router, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BENCHMARK_TRANSITION_DURATION_MS } from "@/components/benchmark/constants";
import {
	buildBenchmarkPath,
	useResolvedBenchmarkImpl,
	useResolvedBenchmarkScenario,
} from "@/components/benchmark/impl-routing";
import { useBenchmarkStore } from "@/components/benchmark/store";

const getParamValue = (
	value: string | string[] | undefined,
): string | undefined => {
	if (!value) return undefined;
	return Array.isArray(value) ? value[0] : value;
};

export default function BenchmarkNavigateTargetScreen() {
	const impl = useResolvedBenchmarkImpl();
	const scenario = useResolvedBenchmarkScenario();
	const navigation = useNavigation();
	const params = useLocalSearchParams<{
		runId?: string | string[];
		cycle?: string | string[];
	}>();
	const hasExecutedRef = useRef(false);

	const runId = getParamValue(params.runId);
	const cycleRaw = getParamValue(params.cycle);
	const cycle = Number(cycleRaw);

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
		let backTimeout: ReturnType<typeof setTimeout> | null = null;
		let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

		const step = () => {
			if (disposed || hasExecutedRef.current) return;

			const { activeRun, recordNavigateTargetMounted } = useBenchmarkStore.getState();
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
			recordNavigateTargetMounted(runId, cycle, performance.now());

			backTimeout = setTimeout(() => {
				goBackToController();
				fallbackTimeout = setTimeout(() => {
					const basePath = buildBenchmarkPath(impl);
					router.replace(`${basePath}?scenario=${scenario}` as never);
				}, BENCHMARK_TRANSITION_DURATION_MS + 120);
			}, 0);
		};

		step();

		return () => {
			disposed = true;
			if (waitFrameHandle !== null) cancelAnimationFrame(waitFrameHandle);
			if (backTimeout !== null) clearTimeout(backTimeout);
			if (fallbackTimeout !== null) clearTimeout(fallbackTimeout);
		};
	}, [cycle, impl, navigation, runId, scenario]);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.content}>
				<ActivityIndicator size="small" color="#fff" />
				<Text style={styles.title}>Navigating During Close</Text>
				<Text style={styles.detail}>
					{impl} • cycle {Number.isFinite(cycle) ? cycle : "-"}
				</Text>
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
		gap: 8,
		paddingHorizontal: 28,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#e2e8f0",
	},
	detail: {
		fontSize: 13,
		color: "#94a3b8",
	},
});
