import { StyleSheet, Text, View } from "react-native";
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
		"#dbeafe", // Lightest blue
		"#bfdbfe",
		"#93c5fd",
		"#60a5fa",
		"#3b82f6",
		"#2563eb",
		"#1d4ed8",
		"#1e40af",
		"#1e3a8a", // Darkest blue
	];

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
				<View style={styles.paletteContainer}>
					{bluePalette.map((color) => (
						<View
							key={color}
							style={[styles.paletteItem, { backgroundColor: color }]}
						/>
					))}
				</View>
			</Transition.ScrollView>
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "white",
		paddingTop: 50,
		borderRadius: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 100,
		elevation: 2,
	},
	header: {
		paddingVertical: 20,
		paddingHorizontal: 20,
		backgroundColor: "white",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "black", // Blue color
	},
	profileSection: {
		alignItems: "center",
		paddingVertical: 20,
	},
	profileIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#f3f4f6", // Blue color
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	profileIconText: {
		fontSize: 32,
		fontWeight: "bold",
		color: "black",
	},
	profileName: {
		fontSize: 20,
		fontWeight: "600",
		color: "black",
	},
	profileDescription: {
		fontSize: 14,
		color: "black",
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
		color: "black", // Blue color
	},
	paletteContainer: {
		paddingHorizontal: 20,
		gap: 12,
	},
	paletteItem: {
		height: 60,
		borderRadius: 24,
	},
});
