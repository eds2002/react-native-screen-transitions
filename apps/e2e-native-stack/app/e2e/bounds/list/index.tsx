import { router } from "expo-router";
import { useState } from "react";
import {
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Transition from "react-native-screen-transitions";

export default function List() {
	const [items, setItems] = useState<number[]>([]);

	const addItem = () => {
		const newId = Math.floor(Math.random() * 10000) + 1;
		setItems([...items, newId]);
	};

	const removeItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};

	const renderItem = ({ item, index }: { item: number; index: number }) => (
		<Transition.Pressable
			style={styles.itemContainer}
			onPress={() =>
				router.push({
					pathname: "/e2e/bounds/list/[id]",
					params: {
						id: `list-bounds-${item}`,
						nestedIcon: `list-bounds-${item}-icon`,
					},
				})
			}
			sharedBoundTag={`list-bounds-${item}`}
		>
			<Transition.View
				style={styles.square}
				sharedBoundTag={`list-bounds-${item}-icon`}
			>
				<Text style={styles.indexText}>{item}</Text>
			</Transition.View>
			<TouchableOpacity
				onPress={() => removeItem(index)}
				style={styles.removeButton}
			>
				<Text style={styles.removeButtonText}>Remove</Text>
			</TouchableOpacity>
		</Transition.Pressable>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>List</Text>
			<TouchableOpacity onPress={addItem} style={styles.addButton}>
				<Text style={styles.addButtonText}>Add Item</Text>
			</TouchableOpacity>
			<FlatList
				data={items}
				renderItem={renderItem}
				keyExtractor={(_, index) => index.toString()}
				style={styles.list}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	addButton: {
		backgroundColor: "#007AFF",
		padding: 15,
		borderRadius: 5,
		alignItems: "center",
		marginBottom: 20,
	},
	addButtonText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 16,
	},
	list: {
		flex: 1,
	},
	itemContainer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	square: {
		width: 50,
		height: 50,
		backgroundColor: "#f0f0f0",
		borderWidth: 1,
		borderColor: "#ccc",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	indexText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	removeButton: {
		backgroundColor: "#FF3B30",
		padding: 8,
		borderRadius: 5,
		marginLeft: "auto",
	},
	removeButtonText: {
		color: "white",
		fontSize: 12,
		fontWeight: "bold",
	},
});
