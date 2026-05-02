import { router } from "expo-router";
import {
	buildBenchmarkDashboardPath,
	PUBLIC_BENCHMARKS,
} from "@/components/benchmark/scenarios";
import { ListScreen } from "@/components/ui";

export default function StackBenchmarkIndexScreen() {
	return (
		<ListScreen
			title="Benchmarks"
			subtitle="Stable, publishable stack benchmarks. One page per benchmark."
			items={PUBLIC_BENCHMARKS.map((benchmark) => ({
				id: benchmark.id,
				title: benchmark.title,
				description: benchmark.description,
			}))}
			testIdPrefix="benchmark"
			onPress={(id) =>
				router.push(
					buildBenchmarkDashboardPath(
						id as (typeof PUBLIC_BENCHMARKS)[number]["id"],
					),
				)
			}
		/>
	);
}
