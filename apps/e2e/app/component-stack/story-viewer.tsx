import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Dimensions,
	Image,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated, {
	cancelAnimation,
	interpolate,
	runOnJS,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";
import { ScreenHeader } from "@/components/screen-header";

type ParamList = {
	list: undefined;
	story: { userId: string };
};

type ListProps = ComponentStackScreenProps<ParamList, "list">;
type StoryProps = ComponentStackScreenProps<ParamList, "story">;

const Stack = createComponentStackNavigator<ParamList>();

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STORY_DURATION = 5000;

const USERS = [
	{
		id: "user1",
		name: "Sarah",
		avatar: "https://i.pravatar.cc/100?img=1",
		stories: [
			{ id: "1a", color: "#E1306C" },
			{ id: "1b", color: "#C13584" },
			{ id: "1c", color: "#833AB4" },
		],
	},
	{
		id: "user2",
		name: "Mike",
		avatar: "https://i.pravatar.cc/100?img=2",
		stories: [
			{ id: "2a", color: "#405DE6" },
			{ id: "2b", color: "#5B51D8" },
		],
	},
	{
		id: "user3",
		name: "Emma",
		avatar: "https://i.pravatar.cc/100?img=3",
		stories: [
			{ id: "3a", color: "#F77737" },
			{ id: "3b", color: "#FCAF45" },
			{ id: "3c", color: "#FFDC80" },
			{ id: "3d", color: "#FD1D1D" },
		],
	},
	{
		id: "user4",
		name: "James",
		avatar: "https://i.pravatar.cc/100?img=4",
		stories: [{ id: "4a", color: "#1DB954" }],
	},
];

const storyInterpolator = (props: ScreenInterpolationProps) => {
	"worklet";
	const { progress, layouts } = props;
	const { height } = layouts.screen;

	const translateY = interpolate(progress, [0, 1], [height, 0], "clamp");
	const scale = interpolate(progress, [1, 2], [1, 0.9], "clamp");

	return {
		contentStyle: {
			transform: [{ translateY }, { scale }],
		},
	};
};

function StoryList({ navigation }: ListProps) {
	return (
		<View style={styles.listContainer}>
			<ScreenHeader
				title="Story Viewer"
				subtitle="Tap a story to open. Swipe down to close. Tap sides to navigate."
			/>
			<View style={styles.storiesRow}>
				{USERS.map((user) => (
					<Pressable
						key={user.id}
						style={styles.storyItem}
						onPress={() => navigation.push("story", { userId: user.id })}
					>
						<View style={styles.storyRing}>
							<Image source={{ uri: user.avatar }} style={styles.avatar} />
						</View>
						<Text style={styles.userName}>{user.name}</Text>
					</Pressable>
				))}
			</View>
		</View>
	);
}

function StoryViewer({ navigation, route }: StoryProps) {
	const insets = useSafeAreaInsets();
	const user = USERS.find((u) => u.id === route.params?.userId) ?? USERS[0];
	const [currentIndex, setCurrentIndex] = useState(0);
	const progress = useSharedValue(0);
	const isPaused = useRef(false);

	const goNext = useCallback(() => {
		if (currentIndex < user.stories.length - 1) {
			setCurrentIndex((i) => i + 1);
		} else {
			navigation.goBack();
		}
	}, [currentIndex, user.stories.length, navigation]);

	const goPrev = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex((i) => i - 1);
		}
	}, [currentIndex]);

	useEffect(() => {
		progress.value = 0;
		progress.value = withTiming(1, { duration: STORY_DURATION }, (finished) => {
			if (finished) {
				runOnJS(goNext)();
			}
		});

		return () => {
			cancelAnimation(progress);
		};
	}, [goNext, progress]);

	const handlePressIn = useCallback(() => {
		isPaused.current = true;
		cancelAnimation(progress);
	}, [progress]);

	const handlePressOut = useCallback(() => {
		if (isPaused.current) {
			isPaused.current = false;
			const remaining = 1 - progress.value;
			progress.value = withTiming(
				1,
				{ duration: remaining * STORY_DURATION },
				(finished) => {
					if (finished) {
						runOnJS(goNext)();
					}
				},
			);
		}
	}, [progress, goNext]);

	const handleTap = useCallback(
		(x: number) => {
			if (x < SCREEN_WIDTH / 3) {
				goPrev();
			} else if (x > (SCREEN_WIDTH * 2) / 3) {
				goNext();
			}
		},
		[goNext, goPrev],
	);

	const currentStory = user.stories[currentIndex];

	return (
		<View
			style={[styles.storyContainer, { backgroundColor: currentStory.color }]}
		>
			<View style={[styles.progressRow, { top: insets.top + 8 }]}>
				{user.stories.map((story, index) => (
					<View key={story.id} style={styles.progressBarBg}>
						{index < currentIndex ? (
							<View style={[styles.progressBarFill, { width: "100%" }]} />
						) : index === currentIndex ? (
							<ProgressBar progress={progress} />
						) : null}
					</View>
				))}
			</View>

			<View style={[styles.storyHeader, { top: insets.top + 24 }]}>
				<View style={styles.storyUserInfo}>
					<Image source={{ uri: user.avatar }} style={styles.storyAvatar} />
					<Text style={styles.storyUserName}>{user.name}</Text>
				</View>
				<Pressable onPress={() => navigation.goBack()} hitSlop={12}>
					<Ionicons name="close" size={28} color="#fff" />
				</Pressable>
			</View>

			<Pressable
				style={styles.touchArea}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				onPress={(e) => handleTap(e.nativeEvent.locationX)}
			>
				<View style={styles.storyContent}>
					<Text style={styles.storyLabel}>
						Story {currentIndex + 1} of {user.stories.length}
					</Text>
				</View>
			</Pressable>
		</View>
	);
}

function ProgressBar({ progress }: { progress: SharedValue<number> }) {
	const animatedStyle = useAnimatedStyle(() => ({
		width: `${progress.value * 100}%`,
	}));

	return <Animated.View style={[styles.progressBarFill, animatedStyle]} />;
}

export default function StoryViewerDemo() {
	return (
		<View style={styles.container}>
			<Stack.Navigator initialRouteName="list">
				<Stack.Screen
					name="list"
					component={StoryList}
					options={{
						gestureEnabled: false,
					}}
				/>
				<Stack.Screen
					name="story"
					component={StoryViewer}
					options={{
						gestureEnabled: true,
						gestureDirection: "vertical",
						screenStyleInterpolator: storyInterpolator,
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
			</Stack.Navigator>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	listContainer: {
		flex: 1,
		backgroundColor: "#121212",
	},
	storiesRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingHorizontal: 16,
		paddingTop: 24,
	},
	storyItem: {
		alignItems: "center",
	},
	storyRing: {
		width: 72,
		height: 72,
		borderRadius: 36,
		padding: 3,
		borderWidth: 2,
		borderColor: "#E1306C",
		marginBottom: 8,
	},
	avatar: {
		width: "100%",
		height: "100%",
		borderRadius: 32,
	},
	userName: {
		fontSize: 13,
		color: "#fff",
		fontWeight: "500",
	},
	storyContainer: {
		flex: 1,
	},
	progressRow: {
		position: "absolute",
		left: 8,
		right: 8,
		flexDirection: "row",
		gap: 4,
		zIndex: 10,
	},
	progressBarBg: {
		flex: 1,
		height: 3,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		overflow: "hidden",
	},
	progressBarFill: {
		height: "100%",
		backgroundColor: "#fff",
		borderRadius: 2,
	},
	storyHeader: {
		position: "absolute",
		left: 16,
		right: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		zIndex: 10,
	},
	storyUserInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	storyAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#fff",
	},
	storyUserName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#fff",
	},
	touchArea: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	storyContent: {
		alignItems: "center",
	},
	storyLabel: {
		fontSize: 16,
		color: "rgba(255,255,255,0.5)",
		fontWeight: "500",
	},
});
