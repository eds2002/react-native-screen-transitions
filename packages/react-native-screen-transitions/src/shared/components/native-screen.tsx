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
	useAnimatedRef,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useStack } from "../hooks/navigation/use-stack";
import { useSharedValueState } from "../hooks/reanimated/use-shared-value-state";
import { LayoutAnchorProvider } from "../providers/layout-anchor.provider";
import { useManagedStackContext } from "../providers/stack/managed.provider";
import { AnimationStore } from "../stores/animation.store";
import type { BackdropBehavior } from "../types/screen.types";
import {
	type ActivityMode,
	type InactiveBehavior,
	POINTER_EVENTS_BOX_NONE,
	POINTER_EVENTS_NONE,
	resolveNativeScreenLifecycle,
	resolveNativeScreenPointerEvents,
	shouldUnmountNativeScreen,
} from "./native-screen-lifecycle";

const PASSTHROUGH = "passthrough";
const ACTIVITY_CONTENTS_DISPLAY = "contents" as const;
const DISPLAY_FLEX = "flex" as const;
const DISPLAY_NONE = "none" as const;

interface ScreenProps {
	routeKey: string;
	index: number;
	isPreloaded: boolean;
	inactiveBehavior?: InactiveBehavior;
	children: ReactNode;
}

export const NativeScreen = ({
	routeKey,
	index,
	isPreloaded,
	inactiveBehavior = "pause",
	children,
}: ScreenProps) => {
	const { routes, optimisticFocusedIndex } = useStack();
	const { backdropBehaviors } = useManagedStackContext();

	const routesLength = routes.length;
	const screenRef = useAnimatedRef<Animated.View>();

	const sceneClosing = AnimationStore.getValue(routeKey, "closing");
	const contentVisible = useSharedValue(true);
	const contentMode = useSharedValue<ActivityMode>("inert");

	const route = routes[index] as
		| ({ state?: unknown } & (typeof routes)[number])
		| undefined;
	const hasNestedState = Boolean(route?.state);
	const nextBackdropBehavior = backdropBehaviors[index + 1] as
		| BackdropBehavior
		| undefined;

	useDerivedValue(() => {
		const nextLifecycle = resolveNativeScreenLifecycle({
			index,
			routesLength,
			isPreloaded,
			focusedIndex: optimisticFocusedIndex.value,
			isClosing: sceneClosing.get(),
			nextBackdropBehavior,
			inactiveBehavior,
		});

		if (nextLifecycle.visible !== contentVisible.get()) {
			contentVisible.set(nextLifecycle.visible);
		}

		if (nextLifecycle.mode !== contentMode.get()) {
			contentMode.set(nextLifecycle.mode);
		}
	});

	const visible = useSharedValueState(contentVisible);
	const mode = useSharedValueState(contentMode);
	const shouldUnmount = shouldUnmountNativeScreen({
		inactiveBehavior,
		visible,
		hasNestedState,
	});

	const animatedProps = useAnimatedProps(() => {
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
			ref={screenRef}
			collapsable={false}
			style={StyleSheet.absoluteFill}
			animatedProps={animatedProps}
		>
			<LayoutAnchorProvider anchorRef={screenRef}>
				<ActivityWrapper mode={mode} visible={visible} style={styles.content}>
					{children}
				</ActivityWrapper>
			</LayoutAnchorProvider>
		</Animated.View>
	);
};

interface ActivityWrapperProps {
	mode: ActivityMode;
	visible: boolean;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
}

const ActivityWrapper = ({
	mode,
	visible,
	style,
	children,
}: ActivityWrapperProps) => {
	const display = visible ? DISPLAY_FLEX : DISPLAY_NONE;
	const reactActivityMode = mode === "paused" ? "hidden" : "visible";

	if (Platform.OS === "web") {
		return (
			<ActivityContainer inert={mode !== "normal"} style={[style, { display }]}>
				{children}
			</ActivityContainer>
		);
	}

	return (
		<Activity mode={reactActivityMode}>
			<ActivityContentView style={{ display: ACTIVITY_CONTENTS_DISPLAY }}>
				<ActivityContainer
					inert={mode !== "normal"}
					style={[style, { display }]}
				>
					{children}
				</ActivityContainer>
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
		// React Activity hides its subtree with display:none when paused.
		// We keep the outer shell at display:contents so visibility can be driven separately.
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
