import { FlatList, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

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
			<View style={styles.profileIcon}>
				<Text style={styles.profileIconText}>U</Text>
			</View>
			<View style={{ gap: 4, alignItems: "center" }}>
				<Text style={styles.profileName}>John Doe</Text>
				<Text style={styles.profileDescription}>
					Lorem ipsum dolor sit amet consectetur adipisicing elit.
				</Text>
			</View>
		</View>
	);
};

export default function PaletteProfile() {
	const bluePalette = [
		"#023e8a",
		"#0077b6",
		"#0096c7",
		"#00b4d8",
		"#48cae4",
		"#90e0ef",
		"#ade8f4",
		"#caf0f8",
	].reverse();

	return (
		<Transition.View style={styles.container}>
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
					data={bluePalette}
					numColumns={2}
					scrollEnabled={false}
					keyExtractor={(item) => item as string}
					contentContainerStyle={styles.paletteContainer}
					columnWrapperStyle={{ gap: 18 }}
					renderItem={({ item: color }) => (
						<View
							style={[
								styles.paletteItem,
								{
									backgroundColor: color,
									height: 100,
									flex: 1,
									aspectRatio: 1,
								},
							]}
						/>
					)}
				/>
			</Transition.ScrollView>
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
		paddingTop: 50,
		borderRadius: 24,
		overflow: "hidden",
	},
	header: {
		paddingVertical: 20,
		paddingHorizontal: 20,
		backgroundColor: "#000",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "white", // Blue color
	},
	profileSection: {
		alignItems: "center",
		paddingVertical: 20,
	},
	profileIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "darkgrey", // Blue color
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	profileIconText: {
		fontSize: 32,
		fontWeight: "bold",
		color: "white",
	},
	profileName: {
		fontSize: 20,
		fontWeight: "600",
		color: "white",
	},
	profileDescription: {
		fontSize: 14,
		color: "white",
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
		color: "white", // Blue color
	},
	paletteContainer: {
		paddingHorizontal: 20,
		gap: 16,
	},
	paletteItem: {
		height: 60,
		borderRadius: 36,
	},
});
