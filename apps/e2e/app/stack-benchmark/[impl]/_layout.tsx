import { CardStyleInterpolators } from "@react-navigation/stack";
import { interpolate } from "react-native-reanimated";
import { BENCHMARK_TRANSITION_DURATION_MS } from "@/components/benchmark/constants";
import { useResolvedBenchmarkImpl } from "@/components/benchmark/impl-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { JsStack } from "@/layouts/js-stack";

const BLANK_STACK_TRANSITION_SPEC = {
	open: {
		duration: BENCHMARK_TRANSITION_DURATION_MS,
	},
	close: {
		duration: BENCHMARK_TRANSITION_DURATION_MS,
	},
};

const JS_STACK_TRANSITION_SPEC = {
	open: {
		animation: "timing" as const,
		config: {
			duration: BENCHMARK_TRANSITION_DURATION_MS,
		},
	},
	close: {
		animation: "timing" as const,
		config: {
			duration: BENCHMARK_TRANSITION_DURATION_MS,
		},
	},
};

const blankStackScreenOptions = {
	gestureEnabled: false,
	gestureDirection: "horizontal" as const,
	transitionSpec: BLANK_STACK_TRANSITION_SPEC,
	screenStyleInterpolator: ({
		progress,
		layouts: {
			screen: { width },
		},
	}: any) => {
		"worklet";
		const translateX = interpolate(progress, [0, 1, 2], [width, 0, -width * 0.3]);
		return {
			content: {
				style: {
					transform: [{ translateX }],
				},
			},
		};
	},
};

const jsStackScreenOptions = {
	gestureEnabled: false,
	gestureDirection: "horizontal" as const,
	transitionSpec: JS_STACK_TRANSITION_SPEC,
	cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

export default function BenchmarkImplLayout() {
	const impl = useResolvedBenchmarkImpl();

	if (impl === "js-stack") {
		return (
			<JsStack screenOptions={jsStackScreenOptions}>
				<JsStack.Screen name="index" />
				<JsStack.Screen name="run" />
				<JsStack.Screen name="navigate-target" />
			</JsStack>
		);
	}

	return (
		<BlankStack screenOptions={blankStackScreenOptions}>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="run" />
			<BlankStack.Screen name="navigate-target" />
		</BlankStack>
	);
}
