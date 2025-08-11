import { FontAwesome6 } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

function Header() {
	const router = useRouter();
	return (
		<View
			style={{
				height: 56,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				paddingHorizontal: 16,
				borderBottomWidth: 1,
				borderBottomColor: "#e5e5e5",
				backgroundColor: "#fff",
			}}
		>
			<View style={{ width: 40 }} />
			<Text style={{ fontSize: 17, fontWeight: "600", color: "#111" }}>
				Settings
			</Text>
			<Pressable
				accessibilityRole="button"
				onPress={() => router.back()}
				style={{
					width: 30,
					height: 30,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#eee",
					borderRadius: 99,
				}}
			>
				<FontAwesome6 name="xmark" size={16} color="gray" />
			</Pressable>
		</View>
	);
}

function Profile() {
	return (
		<View
			style={{
				paddingHorizontal: 16,
				paddingVertical: 20,
				backgroundColor: "#fff",
			}}
		>
			<View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
				<View
					style={{
						width: 56,
						height: 56,
						borderRadius: 12,
						backgroundColor: "#000",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text style={{ color: "#fff", fontWeight: "700", fontSize: 22 }}>
						J
					</Text>
				</View>
				<View style={{ flex: 1 }}>
					<Text style={{ fontSize: 16, fontWeight: "600", color: "#111" }}>
						Jordan Reeves
					</Text>
					<Text style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
						jordan.reeves@example.com
					</Text>
				</View>
			</View>
		</View>
	);
}

type SettingItemProps = {
	iconName?: React.ComponentProps<typeof FontAwesome6>["name"];
	title: string;
	onPress?: () => void;
};

function SettingItem({
	iconName = "square",
	title,
	onPress,
}: SettingItemProps) {
	return (
		<Pressable
			onPress={onPress}
			style={{
				flexDirection: "row",
				alignItems: "center",
				paddingHorizontal: 16,
				paddingVertical: 12,
				backgroundColor: "#fff",
			}}
		>
			<View
				style={{
					width: 30,
					height: 30,
					backgroundColor: "#fff",
					borderRadius: 6,
					alignItems: "center",
					justifyContent: "center",
					marginRight: 12,
					borderWidth: 1,
					borderColor: "#e5e5e5",
				}}
			>
				<FontAwesome6 name={iconName} size={12} color="#000" />
			</View>
			<Text style={{ flex: 1, fontSize: 16, color: "#111" }}>{title}</Text>
			<FontAwesome6 name="chevron-right" size={14} color="#9ca3af" />
		</Pressable>
	);
}

function Topic({ title }: { title: string }) {
	return (
		<View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 }}>
			<Text
				style={{
					fontSize: 12,
					color: "#6b7280",
					letterSpacing: 1,
					fontWeight: "600",
				}}
			>
				{title.toUpperCase()}
			</Text>
		</View>
	);
}

export default function A() {
	const onPress = () => {
		router.push("/examples/settings-modal/b");
	};
	return (
		<View
			style={{
				flex: 1,
			}}
		>
			<Header />
			<Transition.ScrollView
				contentContainerStyle={{ paddingBottom: 24, backgroundColor: "#fff" }}
				showsVerticalScrollIndicator={false}
				style={{ backgroundColor: "#fff" }}
			>
				<Profile />

				{/* Settings Sections */}
				<View style={{ height: 12 }} />

				<Topic title="Account" />
				<View style={{ backgroundColor: "#fff" }}>
					<SettingItem iconName="user" title="Profile" onPress={onPress} />
					<SettingItem
						iconName="lock"
						title="Password & Security"
						onPress={onPress}
					/>
					<SettingItem
						iconName="envelope"
						title="Email Preferences"
						onPress={onPress}
					/>
					<SettingItem
						iconName="envelope"
						title="Email Preferences"
						onPress={onPress}
					/>
				</View>

				<Topic title="Preferences" />
				<View style={{ backgroundColor: "#fff" }}>
					<SettingItem iconName="moon" title="Appearance" />
					<SettingItem iconName="globe" title="Language" />
					<SettingItem iconName="bell" title="Notifications" />
					<SettingItem iconName="clock" title="Time & Date" />
				</View>

				<Topic title="Privacy" />
				<View style={{ backgroundColor: "#fff" }}>
					<SettingItem iconName="user-secret" title="Tracking" />
					<SettingItem iconName="location-dot" title="Location Services" />
					<SettingItem iconName="comment-dots" title="Messages Privacy" />
				</View>

				<Topic title="Support" />
				<View style={{ backgroundColor: "#fff" }}>
					<SettingItem iconName="circle-question" title="Help Center" />
					<SettingItem iconName="file-lines" title="Terms of Service" />
					<SettingItem iconName="user-lock" title="Privacy Policy" />
				</View>

				<Topic title="About" />
				<View style={{ backgroundColor: "#fff" }}>
					<SettingItem iconName="circle-info" title="Version" />
					<SettingItem iconName="lightbulb" title="What’s New" />
					<SettingItem iconName="envelope-open-text" title="Contact Us" />
				</View>
			</Transition.ScrollView>
		</View>
	);
}
