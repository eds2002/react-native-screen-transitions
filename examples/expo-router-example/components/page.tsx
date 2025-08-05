import { Fragment } from "react";
import {
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import type { AnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { Footer } from "./footer";

interface PageProps {
	children?: React.ReactNode;
	title?: string;
	description?: string;
	backIcon?: string;
	contentContainerStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
	scrollEnabled?: boolean;
	style?: StyleProp<ViewStyle>;
}

function PageComponent({
	children,
	title,
	description,
	backIcon,
	contentContainerStyle,
	style,
	scrollEnabled = true,
}: PageProps) {
	const { top } = useSafeAreaInsets();
	return (
		<Fragment>
			<Transition.ScrollView
				style={style}
				contentContainerStyle={[
					{
						padding: 24,
						gap: 36,
						paddingTop: top + 64,
					},
					contentContainerStyle,
				]}
				showsVerticalScrollIndicator={false}
				scrollEnabled={scrollEnabled}
			>
				<View style={styles.header}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.description}>{description}</Text>
				</View>
				{children}
			</Transition.ScrollView>
			<Footer backIcon={backIcon} />
		</Fragment>
	);
}

function Group({
	children,
	title,
	description,
}: {
	children?: React.ReactNode;
	title?: string;
	description?: string;
}) {
	return (
		<View style={styles.group}>
			<Text style={styles.titleSmall}>{title}</Text>
			<Text style={styles.descriptionSmall}>{description}</Text>
			{children}
		</View>
	);
}

const Page = Object.assign(PageComponent, { Group });

export default Page;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		gap: 36,
	},
	header: {
		gap: 2,
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
	},
	description: {
		fontSize: 14,
		color: "gray",
		fontWeight: "500",
	},

	titleSmall: {
		fontSize: 20,
		fontWeight: "600",
	},
	descriptionSmall: {
		fontSize: 12,
		color: "gray",
		fontWeight: "500",
	},
	group: {
		gap: 4,
	},
});
