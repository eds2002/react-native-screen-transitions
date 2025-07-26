import { router } from "expo-router";
import {
	Dimensions,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Transition, { Bounds } from "react-native-screen-transitions";

export const bakingPosts = [
	{
		id: "post-1",
		image:
			"https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400",
		category: "dessert",
	},
	{
		id: "post-2",
		image:
			"https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400",
		category: "cookie",
	},
	{
		id: "post-3",
		image:
			"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400",
		category: "cake",
	},
	{
		id: "post-4",
		image:
			"https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400",
		category: "batter",
	},
	{
		id: "post-5",
		image:
			"https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=400",
		category: "dessert",
	},
	{
		id: "post-6",
		image:
			"https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=400",
		category: "cookie",
	},
	{
		id: "post-7",
		image:
			"https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=400",
		category: "cake",
	},
	{
		id: "post-8",
		image:
			"https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=400",
		category: "batter",
	},
	{
		id: "post-9",
		image:
			"https://images.unsplash.com/photo-1550617931-e17a7b70daa2?w=400&h=400",
		category: "dessert",
	},
	{
		id: "post-10",
		image:
			"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400",
		category: "cookie",
	},
	{
		id: "post-11",
		image:
			"https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=400",
		category: "cake",
	},
	{
		id: "post-12",
		image:
			"https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400",
		category: "dessert",
	},
	{
		id: "post-13",
		image:
			"https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?w=400&h=400",
		category: "pastry",
	},
	{
		id: "post-14",
		image:
			"https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400",
		category: "bread",
	},
	{
		id: "post-15",
		image:
			"https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400",
		category: "muffin",
	},
	{
		id: "post-16",
		image:
			"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400",
		category: "donut",
	},
	{
		id: "post-17",
		image:
			"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400",
		category: "pie",
	},
	{
		id: "post-18",
		image:
			"https://images.unsplash.com/photo-1571197119282-7c4e99e6e2e6?w=400&h=400",
		category: "cupcake",
	},
	{
		id: "post-19",
		image:
			"https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400",
		category: "croissant",
	},
	{
		id: "post-20",
		image:
			"https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400",
		category: "bagel",
	},
	{
		id: "post-21",
		image:
			"https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?w=400&h=400",
		category: "tart",
	},
	{
		id: "post-22",
		image:
			"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400",
		category: "brownie",
	},
	{
		id: "post-23",
		image:
			"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400",
		category: "scone",
	},
	{
		id: "post-24",
		image:
			"https://images.unsplash.com/photo-1571197119282-7c4e99e6e2e6?w=400&h=400",
		category: "macaron",
	},
	{
		id: "post-25",
		image:
			"https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400",
		category: "eclair",
	},
	{
		id: "post-26",
		image:
			"https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400",
		category: "danish",
	},
	{
		id: "post-27",
		image:
			"https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?w=400&h=400",
		category: "strudel",
	},
];

const Header = () => {
	return (
		<View style={styles.header}>
			<Text style={styles.headerTitle}>Instagram Mock</Text>
		</View>
	);
};

const PostItem = ({ item }: { item: (typeof bakingPosts)[0] }) => {
	const onPostPress = () => {
		router.push(`/instagram/${item.id}`);
	};
	return (
		<Bounds sharedBoundTag={item.id} onPress={onPostPress}>
			<View style={styles.postContainer}>
				<Image
					source={{ uri: item.image }}
					style={styles.postImage}
					resizeMode="cover"
				/>
			</View>
		</Bounds>
	);
};

const BottomNavigation = () => {
	return (
		<View style={styles.bottomNav}>
			<TouchableOpacity style={styles.navItem}>
				<Text style={styles.navIcon}>🏠</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.navItem}>
				<Text style={styles.navIcon}>🔍</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.navItem}>
				<Text style={styles.navIcon}>📅</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.navItem}>
				<Text style={styles.navIcon}>🛍️</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.navItem}>
				<Text style={styles.navIcon}>👤</Text>
			</TouchableOpacity>
		</View>
	);
};

export default function BakingRecipes() {
	return (
		<Transition.View style={styles.container}>
			<Header />
			<Transition.FlatList
				data={bakingPosts}
				numColumns={3}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				columnWrapperStyle={styles.row}
				renderItem={({ item }) => <PostItem item={item} />}
				showsVerticalScrollIndicator={false}
			/>
			<BottomNavigation />
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingTop: 75,
		paddingBottom: 15,
		paddingHorizontal: 20,
		backgroundColor: "#fff",
		borderBottomWidth: 0.5,
		borderBottomColor: "#e0e0e0",
	},
	backButton: {
		padding: 5,
	},
	backArrow: {
		fontSize: 20,
		color: "#333",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		flex: 1,
		textAlign: "center",
	},
	headerSpacer: {
		width: 30,
	},
	filterContainer: {
		paddingHorizontal: 20,
		paddingVertical: 15,
		gap: 12,
	},
	filterTab: {
		paddingHorizontal: 20,
		paddingVertical: 8,
		backgroundColor: "#f5f5f5",
		borderRadius: 20,
		marginRight: 12,
	},
	filterText: {
		fontSize: 14,
		color: "#666",
		fontWeight: "500",
	},
	listContainer: {
		paddingBottom: 100,
	},
	row: {
		justifyContent: "space-between",
		marginBottom: 2,
	},
	postContainer: {
		borderRadius: 0,
		aspectRatio: 1,
		width: Dimensions.get("window").width / 3,
		height: "auto",
		overflow: "hidden",
		backgroundColor: "#f9f9f9",
		marginHorizontal: 1,
	},
	postImage: {
		width: "100%",
		height: "100%",
	},
	bottomNav: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: "row",
		backgroundColor: "#fff",
		paddingVertical: 15,
		paddingBottom: 30,
		borderTopWidth: 0.5,
		borderTopColor: "#e0e0e0",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	navItem: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	navIcon: {
		fontSize: 20,
	},
});
