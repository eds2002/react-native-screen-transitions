import { FontAwesome6 } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Transition from "react-native-screen-transitions";

interface CardProps {
	title: string;
	description: string;
	href: Href;
}

const TATouchableOpacity =
	Transition.createTransitionAwareComponent(TouchableOpacity);

export const Card = ({ title, description, href }: CardProps) => {
	return (
		<TouchableOpacity
			style={styles.container}
			activeOpacity={0.8}
			onPress={() => router.push(href)}
		>
			<View style={styles.content}>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>{title.charAt(0)}</Text>
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
						{title}
					</Text>
					<Text style={styles.description}>{description}</Text>
				</View>
			</View>
			<View style={styles.chevronContainer}>
				<FontAwesome6
					name="chevron-right"
					size={14}
					color="gray"
					style={styles.chevron}
				/>
			</View>
		</TouchableOpacity>
	);
};

Card.Aware = ({
	title,
	description,
	href,
	sharedBoundTag,
}: CardProps & { sharedBoundTag?: string }) => {
	return (
		<TATouchableOpacity
			style={styles.container}
			activeOpacity={0.8}
			onPress={() => router.push(href)}
			sharedBoundTag={sharedBoundTag}
		>
			<View style={styles.content}>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>{title.charAt(0)}</Text>
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
						{title}
					</Text>
					<Text style={styles.description}>{description}</Text>
				</View>
			</View>
			<View style={styles.chevronContainer}>
				<FontAwesome6
					name="chevron-right"
					size={14}
					color="gray"
					style={styles.chevron}
				/>
			</View>
		</TATouchableOpacity>
	);
};

export const SharedBoundCard = ({ title, description, href }: CardProps) => {
	return <Card title={title} description={description} href={href} />;
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		maxWidth: "100%",
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		gap: 12,
		minWidth: 0,
		maxWidth: "100%",
	},
	textContainer: {
		flex: 1,
		minWidth: 0,
		maxWidth: "100%",
		overflow: "hidden",
	},
	avatar: {
		width: 45,
		height: 45,
		backgroundColor: "#e5e7eb",
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	avatarText: {
		fontSize: 20,
		fontWeight: "600",
		opacity: 0.5,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		width: "100%",
	},
	description: {
		fontSize: 12,
		color: "gray",
		fontWeight: "500",
		width: "100%",
	},
	chevronContainer: {
		flex: 0.3,
		alignItems: "flex-end",
		justifyContent: "center",
	},
	chevron: {
		flex: 0,
	},
});
