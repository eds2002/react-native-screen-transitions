import FontAwesome from "@expo/vector-icons/FontAwesome6";
import MaskedView from "@react-native-masked-view/masked-view";
import { router } from "expo-router";
import type React from "react";
import {
	Pressable,
	type StyleProp,
	Text,
	useWindowDimensions,
	View,
	type ViewStyle,
} from "react-native";
import {
	interpolate,
	type StyleProps,
	withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";

type SnapPoint = StyleProps["maxHeight"];

interface TrayProps {
	snapPoint: SnapPoint;
	detached?: boolean;
	backgroundColor?: string;
	/**
	 * Additional styles for the tray mask container.
	 */
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
}

interface TrayHeaderProps {
	title?: string;
	onClose?: () => void;
}

interface TrayContentProps {
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
}

interface TrayInterpolatorOptions {
	/**
	 * Additional styles to merge with the tray interpolation.
	 * Useful for animating other elements in sync with the tray.
	 */
	additionalStyles?: (props: ScreenInterpolationProps) => StyleProps;
}

// ============================================================================
// Constants
// ============================================================================

const TRAY_ROOT_TAG = "TRAY_ROOT";
const TRAY_CONTENT_ID = "TRAY_CONTENT";
const TRAY_SCALED_CONTENT_ID = "TRAY_SCALED_CONTENT";
const TRAY_BACKGROUND_ID = "TRAY_BACKGROUND";

const DEFAULT_BORDER_RADIUS = 36;
const DEFAULT_MARGIN = 16;
const DEFAULT_DETACHED = true;

/**
 * Parses a snap point to a percentage number (0-100).
 * Non-worklet version for component use.
 */
const parseSnapPointToPercent = (
	snapPoint: SnapPoint,
	screenHeight: number,
): number => {
	if (snapPoint === undefined || snapPoint === null) {
		return 100;
	}

	if (typeof snapPoint === "string") {
		const parsed = Number.parseFloat(snapPoint);
		return Number.isNaN(parsed) ? 100 : parsed;
	}

	if (typeof snapPoint === "number") {
		if (snapPoint <= 100) {
			return snapPoint;
		}
		return (snapPoint / screenHeight) * 100;
	}

	return 100;
};

/**
 * Parses a snap point from stored styles (worklet version).
 * Handles both maxHeight percentage strings and raw values.
 */
const parseStoredSnapPoint = (
	maxHeight: SnapPoint,
	screenHeight: number,
): number => {
	"worklet";
	if (maxHeight === undefined || maxHeight === null) {
		return 100;
	}

	if (typeof maxHeight === "string") {
		const parsed = Number.parseFloat(maxHeight);
		return Number.isNaN(parsed) ? 100 : parsed;
	}

	if (typeof maxHeight === "number") {
		if (maxHeight <= 100) {
			return maxHeight;
		}
		return (maxHeight / screenHeight) * 100;
	}

	return 100;
};

/**
 * Calculates the translateY offset for content based on tray height.
 * This creates the parallax effect where content slides up as the tray expands.
 */
const calculateContentTranslateY = (
	heightPercent: number,
	screenHeight: number,
	bottomInset: number,
	detached: boolean,
): number => {
	"worklet";
	return (
		screenHeight * ((100 - heightPercent) / 100) - (detached ? bottomInset : 0)
	);
};

function TrayComponent({
	snapPoint,
	detached = DEFAULT_DETACHED,
	backgroundColor,
	style,
	children,
}: TrayProps) {
	const { height: screenHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const maskStyle: ViewStyle = {
		backgroundColor: "white",
		flex: 1,
		marginTop: "auto",
		maxHeight: snapPoint,
		borderRadius: DEFAULT_BORDER_RADIUS,
		margin: detached ? DEFAULT_MARGIN : 0,
		marginBottom: detached ? insets.bottom : 0,
		overflow: "hidden",
	};

	// Calculate initial translateY based on snap point
	const heightPercent = parseSnapPointToPercent(snapPoint, screenHeight);
	const initialTranslateY = calculateContentTranslateY(
		heightPercent,
		screenHeight,
		insets.bottom,
		detached,
	);

	return (
		<MaskedView
			style={{ flex: 1 }}
			maskElement={
				<Transition.View
					sharedBoundTag={TRAY_ROOT_TAG}
					style={[maskStyle]}
					pointerEvents="none"
				/>
			}
			pointerEvents="box-none"
		>
			<Transition.View
				styleId={TRAY_BACKGROUND_ID}
				style={{ flex: 1, backgroundColor }}
				pointerEvents="box-none"
			>
				<Transition.View
					styleId={TRAY_CONTENT_ID}
					style={[
						{
							flex: 1,
							transform: [{ translateY: initialTranslateY }],
						},
					]}
					pointerEvents="box-none"
				>
					<View
						style={[
							{
								flex: 1,
								maxHeight: snapPoint,
								borderRadius: DEFAULT_BORDER_RADIUS,
								marginHorizontal: detached ? DEFAULT_MARGIN : 0,
								marginBottom: detached ? insets.bottom : 0,
							},
							style,
						]}
					>
						{children}
					</View>
				</Transition.View>
			</Transition.View>
		</MaskedView>
	);
}

function TrayHeader({ title = "Header", onClose }: TrayHeaderProps) {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				width: "100%",
				padding: 24,
			}}
		>
			<Text style={{ fontSize: 20, fontWeight: "600" }}>{title}</Text>
			<Pressable
				onPress={onClose ?? router.back}
				style={{
					width: 30,
					height: 30,
					borderRadius: 50,
					backgroundColor: "#f5f5f5",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<FontAwesome name="xmark" size={18} color="#a3a3a3" />
			</Pressable>
		</View>
	);
}

function TrayContent({ style, children }: TrayContentProps) {
	return (
		<Transition.View
			styleId={TRAY_SCALED_CONTENT_ID}
			style={[{ flex: 1, paddingHorizontal: 24 }, style]}
			pointerEvents="box-none"
		>
			{children}
		</Transition.View>
	);
}

function createInterpolator(
	options: TrayInterpolatorOptions & { detached?: boolean } = {},
) {
	"worklet";
	return (props: ScreenInterpolationProps) => {
		"worklet";

		const {
			progress,
			focused,
			bounds,
			current,
			next,
			previous,
			layouts: { screen },
			insets,
		} = props;

		// Get occurrences for current and target screens
		const currentOcc = bounds.getSnapshot(TRAY_ROOT_TAG, current.route.key);

		// For focused screen, we interpolate FROM previous TO current
		// For unfocused screen, we interpolate FROM current TO next
		const targetKey = focused
			? (previous?.route.key ?? "")
			: (next?.route.key ?? "");

		const targetOcc = bounds.getSnapshot(TRAY_ROOT_TAG, targetKey);

		// Parse heights
		const currentHeight = parseStoredSnapPoint(
			currentOcc?.styles?.maxHeight,
			screen.height,
		);

		// If no target snapshot (first tray, or next screen not rendered yet),
		// use current values to avoid animating to wrong height
		const targetHeight = targetOcc
			? parseStoredSnapPoint(targetOcc?.styles?.maxHeight, screen.height)
			: currentHeight;

		// Parse margins (0 if not detached)
		const currentMargin =
			typeof currentOcc?.styles?.margin === "number"
				? currentOcc.styles.margin
				: 0;
		const targetMargin = targetOcc
			? typeof targetOcc?.styles?.margin === "number"
				? targetOcc.styles.margin
				: 0
			: currentMargin;

		// Parse margin bottoms (0 if not detached)
		const currentMarginBottom =
			typeof currentOcc?.styles?.marginBottom === "number"
				? currentOcc.styles.marginBottom
				: 0;
		const targetMarginBottom = targetOcc
			? typeof targetOcc?.styles?.marginBottom === "number"
				? targetOcc.styles.marginBottom
				: 0
			: currentMarginBottom;

		// Parse border radius
		const currentBorderRadius =
			typeof currentOcc?.styles?.borderRadius === "number"
				? currentOcc.styles.borderRadius
				: DEFAULT_BORDER_RADIUS;
		const targetBorderRadius = targetOcc
			? typeof targetOcc?.styles?.borderRadius === "number"
				? targetOcc.styles.borderRadius
				: DEFAULT_BORDER_RADIUS
			: currentBorderRadius;

		// Calculate content translateY
		const currentTranslateY = calculateContentTranslateY(
			currentHeight,
			screen.height,
			insets.bottom,
			options.detached ?? true,
		);
		const targetTranslateY = calculateContentTranslateY(
			targetHeight,
			screen.height,
			insets.bottom,
			options.detached ?? true,
		);

		let styles: StyleProps;

		if (focused) {
			styles = {
				[TRAY_ROOT_TAG]: {
					marginTop: "auto",
					margin: interpolate(progress, [0, 1], [targetMargin, currentMargin]),
					marginBottom: interpolate(
						progress,
						[0, 1],
						[targetMarginBottom, currentMarginBottom],
					),
					maxHeight: `${interpolate(
						progress,
						[0, 1],
						[targetHeight, currentHeight],
					)}%`,
					borderRadius: interpolate(
						progress,
						[0, 1],
						[targetBorderRadius, currentBorderRadius],
					),
					overflow: "hidden" as const,
				},
				[TRAY_CONTENT_ID]: {
					transform: [
						{
							translateY: interpolate(
								progress,
								[0, 1],
								[targetTranslateY, currentTranslateY],
							),
						},
					],
				},
				[TRAY_SCALED_CONTENT_ID]: {
					transform: [
						{
							scale: withSpring(interpolate(progress, [0, 1], [0.9, 1]), {
								mass: 0.3,
								stiffness: 2000,
								damping: 18,
							}),
						},
					],
				},
				[TRAY_BACKGROUND_ID]: {
					opacity: withSpring(interpolate(progress, [0.1, 0.9], [0, 1]), {
						mass: 0.3,
						stiffness: 2000,
						damping: 18,
					}),
				},
			};
		} else {
			styles = {
				[TRAY_ROOT_TAG]: {
					marginTop: "auto",
					margin: interpolate(progress, [1, 2], [currentMargin, targetMargin]),
					marginBottom: interpolate(
						progress,
						[1, 2],
						[currentMarginBottom, targetMarginBottom],
					),
					maxHeight: `${interpolate(
						progress,
						[1, 2],
						[currentHeight, targetHeight],
					)}%`,
					borderRadius: interpolate(
						progress,
						[1, 2],
						[currentBorderRadius, targetBorderRadius],
					),
					overflow: "hidden" as const,
					opacity: props.stackProgress > 2 ? 0 : 1,
				},
				[TRAY_CONTENT_ID]: {
					transform: [
						{
							translateY: interpolate(
								progress,
								[1, 2],
								[currentTranslateY, targetTranslateY],
							),
						},
					],
				},
				[TRAY_SCALED_CONTENT_ID]: {
					transform: [
						{
							scale: withSpring(interpolate(progress, [1, 2], [1, 1.1]), {
								mass: 0.3,
								stiffness: 2000,
								damping: 18,
							}),
						},
					],
				},
			};
		}

		// Merge additional styles if provided
		if (options.additionalStyles) {
			const additional = options.additionalStyles(props);
			return { ...styles, ...additional };
		}

		return styles;
	};
}

export const Tray = {
	View: TrayComponent,
	Header: TrayHeader,
	Content: TrayContent,
	interpolator: createInterpolator,
};

export type {
	TrayProps,
	TrayHeaderProps,
	TrayContentProps,
	TrayInterpolatorOptions,
};
