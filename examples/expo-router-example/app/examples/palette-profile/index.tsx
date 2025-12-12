import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
	Easing,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import Transition, {
	useScreenAnimation,
} from "react-native-screen-transitions";

const Header = () => {
	return (
		<View style={styles.header}>
			<Text style={styles.headerTitle}> Profile</Text>
		</View>
	);
};

const ProfileSection = () => {
	return (
		<View style={[styles.profileSection, { paddingHorizontal: 20 }]}>
			<Transition.Pressable
				sharedBoundTag="profile"
				style={styles.profileIcon}
				onPress={() => {
					router.push({
						pathname: "/examples/palette-profile/profile",
						params: {
							sharedBoundTag: "profile",
						},
					});
				}}
			>
				<Text style={styles.profileIconText}>U</Text>
			</Transition.Pressable>
			<View style={{ gap: 4, alignItems: "center" }}>
				<Text style={styles.profileName}>John Doe</Text>
				<Text style={styles.profileDescription}>
					Lorem ipsum dolor sit amet consectetur adipisicing elit.
				</Text>
			</View>
		</View>
	);
};

const ColorItem = ({ color }: { color: string; index: number }) => {
	const screenProps = useScreenAnimation();
	const scale = useSharedValue(1);

	const boundId = useMemo(() => {
		return `color-${color}`;
	}, [color]);

	const animatedContainerStyle = useAnimatedStyle(() => {
		"worklet";

		if (screenProps.value.activeBoundId === boundId) return {};

		return {
			transform: [
				{
					scale: scale.value,
				},
			],
		};
	});

	useAnimatedReaction(
		() => screenProps.value,
		(props) => {
			if (!props.next?.meta?.scalesOthers) return;

			if (props.next?.closing === undefined) {
				scale.value = withSpring(1);
				return;
			}

			if (props.next.closing === 0) {
				scale.value = withTiming(0, {
					duration: 1000,
					easing: Easing.bezierFn(0.19, 1, 0.22, 1),
				});
			} else if (props.next.closing === 1) {
				scale.value = withTiming(1, {
					duration: 1000,
					easing: Easing.bezierFn(0.19, 1, 0.22, 1),
				});
			}
		},
	);
	return (
		<Transition.Pressable
			sharedBoundTag={`color-${color}`}
			onPress={() => {
				router.push({
					pathname: "/examples/palette-profile/[color]",
					params: { color, sharedBoundTag: `color-${color}` },
				});
			}}
			style={[
				styles.paletteItem,
				animatedContainerStyle,
				{
					backgroundColor: color,
					height: 100,
					flex: 1,
					aspectRatio: 1,
				},
			]}
		/>
	);
};

export default function PaletteProfile() {
	const palette = [
		"#ffb3c1",
		"#ff8fa3",
		"#ff758f",
		"#ff4d6d",
		"#c9184a",
		"#a4133c",
		"#800f2f",
		"#590d22",
	];

	const renderItem = useCallback(
		({ item: color, index }: { item: string; index: number }) => {
			return <ColorItem color={color} index={index} />;
		},
		[],
	);

	return (
		<View style={styles.container}>
			<Header />
			<Transition.ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
				{/* Header */}

				{/* Profile Section */}
				<ProfileSection />

				{/* Tab Section */}
				<View style={[styles.tab, { flexDirection: "row", gap: 12 }]}>
					<Text style={styles.tabText}>Palette</Text>
					<Text style={[styles.tabText, { opacity: 0.5 }]}>Colors</Text>
				</View>

				{/* Palette List */}
				<FlatList
					data={palette}
					numColumns={2}
					scrollEnabled={false}
					keyExtractor={(item, index) => `${item}-${index}`}
					contentContainerStyle={styles.paletteContainer}
					columnWrapperStyle={{ gap: 6 }}
					renderItem={renderItem}
				/>
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f9fa",
		paddingTop: 50,
		borderRadius: 24,
	},
	header: {
		paddingVertical: 20,
		paddingHorizontal: 20,
		backgroundColor: "#f8f9fa",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#212529",
	},
	profileSection: {
		alignItems: "center",
		paddingVertical: 20,
	},
	profileIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#E9ECEF",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	profileIconText: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#6C757D",
	},
	profileName: {
		fontSize: 20,
		fontWeight: "600",
		color: "#212529",
	},
	profileDescription: {
		fontSize: 14,
		color: "#495057",
		fontWeight: "500",
		textAlign: "center",
		opacity: 0.6,
	},
	tab: {
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	tabText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#212529", // Blue color
	},
	paletteContainer: {
		paddingHorizontal: 20,
		gap: 6,
	},
	paletteItem: {
		height: 60,
		borderRadius: 36,
	},
});
