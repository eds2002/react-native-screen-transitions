import {
	getHeaderTitle,
	Header,
	HeaderBackButton,
	HeaderBackContext,
	SafeAreaProviderCompat,
	Screen,
	useHeaderHeight,
} from "@react-navigation/elements";
import { useLinkBuilder } from "@react-navigation/native";
import * as React from "react";
import { Animated, Image, StyleSheet } from "react-native";
import { AwareRootView } from "@/navigator/components/aware-root-view";
import type { Any } from "@/types";
import { useScreenLifecycle } from "../hooks/navigator/use-screen-lifecycle";
import type {
	AwareNativeStackViewProps,
	AwareScreenProps,
	AwareStackDescriptorMap,
} from "../types";

const TRANSPARENT_PRESENTATIONS = [
	"transparentModal",
	"containedTransparentModal",
];

const AwareScreen = React.memo(
	({
		state,
		descriptors,
		preloadedDescriptors,
		index,
		route,
	}: AwareScreenProps) => {
		const parentHeaderBack = React.useContext(HeaderBackContext);
		const isFocused = state.index === index;
		const previousKey = state.routes[index - 1]?.key;
		const nextKey = state.routes[index + 1]?.key;
		const previousDescriptor = previousKey
			? descriptors[previousKey]
			: undefined;
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

		useScreenLifecycle({ route, navigation, options });

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
							navigation: navigation as Any,
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
					presentation != null &&
					TRANSPARENT_PRESENTATIONS.includes(presentation)
						? { backgroundColor: "transparent" }
						: null,
				]}
			>
				<HeaderBackContext.Provider value={headerBack}>
					<AnimatedHeaderHeightProvider>
						<AwareRootView
							currentScreenKey={route.key}
							previousScreenKey={previousKey}
							nextScreenKey={nextKey}
							style={[contentStyle]}
							navigation={navigation}
						>
							{render()}
						</AwareRootView>
					</AnimatedHeaderHeightProvider>
				</HeaderBackContext.Provider>
			</Screen>
		);
	},
);

export function AwareNativeStackView({
	state,
	descriptors,
	describe,
}: AwareNativeStackViewProps) {
	const preloadedDescriptors =
		state.preloadedRoutes.reduce<AwareStackDescriptorMap>((acc, route) => {
			acc[route.key] = acc[route.key] || describe(route, true);
			return acc;
		}, {});

	return (
		<SafeAreaProviderCompat>
			{state.routes.concat(state.preloadedRoutes).map((route, i) => {
				return (
					<AwareScreen
						key={route.key}
						state={state}
						descriptors={descriptors}
						preloadedDescriptors={preloadedDescriptors}
						index={i}
						route={route}
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
