import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition, {
	useScreenAnimation,
} from "react-native-screen-transitions";

const links = [
	"Home",
	"About",
	"Contact",
	"Terms of Service",
	"Privacy Policy",
];

const Link = ({
	children,
	index,
}: {
	children: React.ReactNode;
	href: string;
	index: number;
}) => {
	const opacity = useSharedValue(0);
	const y = useSharedValue(50);

	const { closing } = useScreenAnimation();

	const springConfig = {
		mass: 0.2,
		stiffness: 26.7,
		damping: 4.1,
	};

	const delay = index * 35;

	useEffect(() => {
		if (closing) {
			opacity.value = withTiming(0, { easing: Easing.linear });
			y.value = withDelay(
				(links.length - 1 - index) * 35,
				withSpring(50, springConfig),
			);
			return;
		}

		opacity.value = withDelay(
			delay,
			withTiming(1, {
				easing: Easing.linear,
			}),
		);
		y.value = withDelay(delay, withSpring(1, springConfig));
	}, [opacity, closing, y, delay, index]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
			transform: [
				{
					translateY: y.value,
				},
			],
		};
	});

	return (
		<Animated.Text style={[styles.link, animatedStyle]}>
			{children}
		</Animated.Text>
	);
};

export default function FullscreenNav() {
	const { top } = useSafeAreaInsets();
	const navigation = useNavigation();
	return (
		<Transition.Pressable
			style={{ flex: 1, padding: 24, gap: 24, paddingTop: top + 48 }}
			onPress={navigation.goBack}
		>
			{links.map((link, index) => (
				<Link key={link} href={link} index={index}>
					{link}
				</Link>
			))}
		</Transition.Pressable>
	);
}

const styles = StyleSheet.create({
	link: {
		fontSize: 32,
		fontWeight: "600",
		color: "white",
	},
});
