import { CardStyleInterpolators } from "@react-navigation/stack";
import { interpolate } from "react-native-reanimated";
import { BENCHMARK_TRANSITION_DURATION_MS } from "@/components/benchmark/constants";
import { useResolvedBenchmarkImpl } from "@/components/benchmark/impl-routing";
import { getBenchmarkDefinition } from "@/components/benchmark/scenarios";
import type { BenchmarkScenario } from "@/components/benchmark/types";
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

const baseBlankStackScreenOptions = {
	gestureEnabled: false,
	transitionSpec: BLANK_STACK_TRANSITION_SPEC,
};

const baseJsStackScreenOptions = {
	gestureEnabled: false,
	transitionSpec: JS_STACK_TRANSITION_SPEC,
};

const blankHorizontalInterpolator = ({
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
};

function getBlankStackScreenOptions() {
	return {
		...baseBlankStackScreenOptions,
		gestureDirection: "horizontal" as const,
		screenStyleInterpolator: blankHorizontalInterpolator,
	};
}

function getJsStackScreenOptions(scenario: BenchmarkScenario) {
	const definition = getBenchmarkDefinition(scenario);
	const isTransparent = definition.appearance !== "opaque-card";

	return {
		...baseJsStackScreenOptions,
		...(isTransparent
			? {
					cardStyle: { backgroundColor: "transparent" as const },
				}
			: {}),
		cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
		gestureDirection: "horizontal" as const,
		presentation: "card" as const,
	};
}

const blankStackScreenOptions = () => {
	return getBlankStackScreenOptions();
};

const jsStackScreenOptions = ({
	route,
}: {
	route: { params?: { scenario?: BenchmarkScenario } };
}) => {
	const scenario = route.params?.scenario ?? "push-pop-loop";
	return getJsStackScreenOptions(scenario);
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
