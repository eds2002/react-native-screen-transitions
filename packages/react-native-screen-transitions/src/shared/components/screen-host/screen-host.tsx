import { Activity, type ReactNode } from "react";
import {
	type HostComponent,
	NativeComponentRegistry,
	Platform,
	type StyleProp,
	StyleSheet,
	View,
	type ViewProps,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useStack } from "../../hooks/navigation/use-stack";
import { useSharedValueState } from "../../hooks/reanimated/use-shared-value-state";
import { useManagedStackContext } from "../../providers/stack/managed.provider";
import { AnimationStore } from "../../stores/animation.store";
import type { BackdropBehavior } from "../../types/screen.types";
import {
	type InactiveBehavior,
	type NativeScreenState,
	POINTER_EVENTS_BOX_NONE,
	POINTER_EVENTS_NONE,
	resolveNativeScreenPointerEvents,
	resolveNativeScreenState,
	shouldUnmountNativeScreen,
} from "./helpers";

const PASSTHROUGH = "passthrough";
const ACTIVITY_CONTENTS_DISPLAY = "contents" as const;

interface ScreenProps {
	routeKey: string;
	index: number;
	isPreloaded: boolean;
	inactiveBehavior?: InactiveBehavior;
	children: ReactNode;
}

export const ScreenHost = ({
	routeKey,
	index,
	isPreloaded,
	inactiveBehavior = "pause",
	children,
}: ScreenProps) => {
	const { routes, optimisticFocusedIndex } = useStack();
	const { backdropBehaviors } = useManagedStackContext();

	const routesLength = routes.length;

	const sceneClosing = AnimationStore.getValue(routeKey, "closing");
	const contentState = useSharedValue<NativeScreenState>("inert");

	const route = routes[index] as
		| ({ state?: unknown } & (typeof routes)[number])
		| undefined;

	const hasNestedState = Boolean(route?.state);
	const nextBackdropBehavior = backdropBehaviors[index + 1] as
		| BackdropBehavior
		| undefined;

	useDerivedValue(() => {
		const nextState = resolveNativeScreenState({
			index,
			routesLength,
			isPreloaded,
			focusedIndex: optimisticFocusedIndex.value,
			isClosing: sceneClosing.get(),
			nextBackdropBehavior,
		});

		if (nextState !== contentState.get()) {
			contentState.set(nextState);
		}
	});

	const state = useSharedValueState(contentState);
	const shouldUnmount = shouldUnmountNativeScreen({
		inactiveBehavior,
		state,
		hasNestedState,
	});

	const animatedPointerEvents = useAnimatedProps(() => {
		const isClosing = sceneClosing.get() > 0;
		const activeIndex = optimisticFocusedIndex.value;
		const activeBackdrop = backdropBehaviors[activeIndex] ?? "block";
		const isAllowedPassthroughBelow =
			activeBackdrop === PASSTHROUGH && index === activeIndex - 1;

		return {
			pointerEvents: resolveNativeScreenPointerEvents({
				isClosing,
				isActive: index === activeIndex,
				isAllowedPassthroughBelow,
			}),
		};
	});

	if (shouldUnmount) {
		return null;
	}

	return (
		<Animated.View
			collapsable={false}
			style={StyleSheet.absoluteFill}
			animatedProps={animatedPointerEvents}
		>
			<ActivityWrapper
				state={state}
				inactiveBehavior={inactiveBehavior}
				style={styles.content}
			>
				{children}
			</ActivityWrapper>
		</Animated.View>
	);
};

interface ActivityWrapperProps {
	state: NativeScreenState;
	inactiveBehavior: InactiveBehavior;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
}

const ActivityWrapper = ({
	state,
	inactiveBehavior,
	style,
	children,
}: ActivityWrapperProps) => {
	const inert = state !== "interactive";
	const shouldPauseEffects =
		state === "inactive" && inactiveBehavior !== "none";
	const reactActivityMode = shouldPauseEffects ? "hidden" : "visible";

	if (Platform.OS === "web") {
		return (
			<ActivityContainer inert={inert} style={[style]}>
				{children}
			</ActivityContainer>
		);
	}

	return (
		<Activity mode={reactActivityMode}>
			<ActivityContentView style={{ display: ACTIVITY_CONTENTS_DISPLAY }}>
				{children}
			</ActivityContentView>
		</Activity>
	);
};

interface ActivityContainerProps {
	inert?: boolean;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
}

const ActivityContainer = ({
	inert,
	style,
	children,
}: ActivityContainerProps) => {
	return (
		<View
			aria-hidden={inert}
			pointerEvents={inert ? POINTER_EVENTS_NONE : POINTER_EVENTS_BOX_NONE}
			style={style}
			collapsable={false}
		>
			{children}
		</View>
	);
};

const ACTIVITY_CONTENT_STYLE: Record<
	string,
	true | { process?: (value: unknown) => unknown }
> = {
	display: {
		// React Activity hides its subtree with display:none when effects are paused.
		// We remap the wrapper to display:contents so inactive screens can stay painted.
		process: () => ACTIVITY_CONTENTS_DISPLAY,
	},
};

const ACTIVITY_CONTENT_VIEW_CONFIG = {
	uiViewClassName: "RCTView",
	validAttributes: {
		style: ACTIVITY_CONTENT_STYLE,
	},
};

type ActivityContentViewProps = Omit<ViewProps, "style"> & {
	style?:
		| {
				display?: typeof ACTIVITY_CONTENTS_DISPLAY | undefined;
		  }
		| undefined;
};

const ActivityContentView: HostComponent<ActivityContentViewProps> =
	NativeComponentRegistry.get<ActivityContentViewProps>(
		"ScreenTransitionsActivityContentView",
		() => ACTIVITY_CONTENT_VIEW_CONFIG,
	);

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
