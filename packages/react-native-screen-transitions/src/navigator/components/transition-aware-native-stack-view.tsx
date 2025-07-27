import {
	getHeaderTitle,
	Header,
	HeaderBackButton,
	HeaderBackContext,
	SafeAreaProviderCompat,
	Screen,
	useHeaderHeight,
} from "@react-navigation/elements";
import {
	type ParamListBase,
	type RouteProp,
	type StackNavigationState,
	useLinkBuilder,
} from "@react-navigation/native";
import * as React from "react";
import { Animated, Image, StyleSheet } from "react-native";
import { TransitionAwareRootView } from "@/navigator/components/transition-aware-root-view";
import { ConfigStore } from "@/store/config-store";
import type {
	Any,
	TransitionStackDescriptor,
	TransitionStackDescriptorMap,
	TransitionStackNavigationOptions,
	TransitionStackNavigationProp,
} from "@/types";

type Props = {
	state: StackNavigationState<ParamListBase>;
	// This is used for the native implementation of the stack.
	navigation: TransitionStackNavigationProp<ParamListBase>;
	descriptors: TransitionStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => TransitionStackDescriptor;
	screenProcessor: {
		childOptions: Map<string, TransitionStackNavigationOptions>;
	};
};

const TRANSPARENT_PRESENTATIONS = [
	"transparentModal",
	"containedTransparentModal",
];

const Route = ({
	state,
	descriptors,
	preloadedDescriptors,
	index,
	route,
	screenProcessor,
}: {
	state: StackNavigationState<ParamListBase>;
	descriptors: TransitionStackDescriptorMap;
	preloadedDescriptors: TransitionStackDescriptorMap;
	index: number;
	route: RouteProp<ParamListBase>;
	screenProcessor: {
		childOptions: Map<string, TransitionStackNavigationOptions>;
	};
}) => {
	const parentHeaderBack = React.useContext(HeaderBackContext);
	const isFocused = state.index === index;
	const previousKey = state.routes[index - 1]?.key;
	const nextKey = state.routes[index + 1]?.key;
	const previousDescriptor = previousKey ? descriptors[previousKey] : undefined;
	const nextDescriptor = nextKey ? descriptors[nextKey] : undefined;
	const { options, navigation, render } =
		descriptors[route.key] ?? preloadedDescriptors[route.key];

	const { buildHref } = useLinkBuilder();

	const headerBack = previousDescriptor
		? {
				title: getHeaderTitle(
					previousDescriptor.options,
					previousDescriptor.route.name,
				),
				href: buildHref(
					previousDescriptor.route.name,
					previousDescriptor.route.params,
				),
			}
		: parentHeaderBack;

	const canGoBack = headerBack != null;

	React.useEffect(() => {
		const parentNavigatorKey = navigation.getParent()?.getState?.()?.key;
		const navigatorKey = navigation.getState().key;

		const presetConfig = screenProcessor.childOptions.get(route.name) || {};

		ConfigStore.updateConfig(route.key, {
			id: route.key,
			name: route.name,
			status: 1,
			closing: false,
			navigatorKey,
			parentNavigatorKey,
			...presetConfig,
		});
	}, [route, navigation, screenProcessor]);

	React.useEffect(() => {
		const unsubscribe = navigation.addListener("beforeRemove", (e) => {
			const shouldSkipPreventDefault = ConfigStore.shouldSkipPreventDefault(
				e.target,
				navigation.getState(),
			);

			if (shouldSkipPreventDefault) {
				ConfigStore.removeConfig(e.target);
				return;
			}

			e.preventDefault();
			const handleFinish = (finished?: boolean) => {
				if (!finished) return;
				if (navigation.canGoBack()) {
					navigation.dispatch(e.data?.action);
					ConfigStore.removeConfig(e.target);
				}
			};

			ConfigStore.updateConfig(e.target, {
				status: 0,
				closing: true,
				onAnimationFinish: handleFinish,
			});
		});

		return () => unsubscribe();
	}, [navigation]);

	const {
		header,
		headerShown,
		headerBackImageSource,
		headerLeft,
		headerTransparent,
		headerBackTitle,
		presentation,
		contentStyle,
		...rest
	} = options;

	const nextPresentation = nextDescriptor?.options.presentation;

	const isPreloaded =
		preloadedDescriptors[route.key] !== undefined &&
		descriptors[route.key] === undefined;

	return (
		<Screen
			key={route.key}
			focused={isFocused}
			route={route}
			navigation={navigation}
			headerShown={headerShown}
			headerTransparent={headerTransparent}
			header={
				header !== undefined ? (
					header({
						back: headerBack,
						options: options as Any,
						route,
						navigation,
					})
				) : (
					<Header
						{...rest}
						back={headerBack}
						title={getHeaderTitle(options, route.name)}
						headerLeft={
							typeof headerLeft === "function"
								? ({ label, ...rest }) =>
										headerLeft({
											...rest,
											label: headerBackTitle ?? label,
										})
								: headerLeft === undefined && canGoBack
									? ({ tintColor, label, ...rest }) => (
											<HeaderBackButton
												{...rest}
												label={headerBackTitle ?? label}
												tintColor={tintColor}
												backImage={
													headerBackImageSource !== undefined
														? () => (
																<Image
																	source={headerBackImageSource}
																	resizeMode="contain"
																	tintColor={tintColor}
																	style={styles.backImage}
																/>
															)
														: undefined
												}
												onPress={navigation.goBack}
											/>
										)
									: headerLeft
						}
						headerTransparent={headerTransparent}
					/>
				)
			}
			style={[
				StyleSheet.absoluteFill,
				{
					display:
						(isFocused ||
							(nextPresentation != null &&
								TRANSPARENT_PRESENTATIONS.includes(nextPresentation))) &&
						!isPreloaded
							? "flex"
							: "none",
				},
				presentation != null && TRANSPARENT_PRESENTATIONS.includes(presentation)
					? { backgroundColor: "transparent" }
					: null,
			]}
		>
			<HeaderBackContext.Provider value={headerBack}>
				<AnimatedHeaderHeightProvider>
					<TransitionAwareRootView
						currentScreenKey={route.key}
						previousScreenKey={previousKey}
						nextScreenKey={nextKey}
						style={[contentStyle]}
						navigation={navigation}
					>
						{render()}
					</TransitionAwareRootView>
				</AnimatedHeaderHeightProvider>
			</HeaderBackContext.Provider>
		</Screen>
	);
};

export function TransitionAwareNativeStackView({
	state,
	descriptors,
	describe,
	screenProcessor,
}: Props) {
	const preloadedDescriptors =
		state.preloadedRoutes.reduce<TransitionStackDescriptorMap>((acc, route) => {
			acc[route.key] = acc[route.key] || describe(route, true);
			return acc;
		}, {});

	return (
		<SafeAreaProviderCompat>
			{state.routes.concat(state.preloadedRoutes).map((route, i) => {
				return (
					<Route
						key={route.key}
						state={state}
						descriptors={descriptors}
						preloadedDescriptors={preloadedDescriptors}
						index={i}
						route={route}
						screenProcessor={screenProcessor}
					/>
				);
			})}
		</SafeAreaProviderCompat>
	);
}

const AnimatedHeaderHeightContext = React.createContext<
	Animated.Value | undefined
>(undefined);

const AnimatedHeaderHeightProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const headerHeight = useHeaderHeight();
	const [animatedHeaderHeight] = React.useState(
		() => new Animated.Value(headerHeight),
	);

	React.useEffect(() => {
		animatedHeaderHeight.setValue(headerHeight);
	}, [animatedHeaderHeight, headerHeight]);

	return (
		<AnimatedHeaderHeightContext.Provider value={animatedHeaderHeight}>
			{children}
		</AnimatedHeaderHeightContext.Provider>
	);
};

const styles = StyleSheet.create({
	contentContainer: {
		flex: 1,
	},
	backImage: {
		height: 24,
		width: 24,
		margin: 3,
	},
});
