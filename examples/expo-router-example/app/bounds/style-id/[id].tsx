import { AntDesign, FontAwesome6 } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

const PRICE = 999.99;
const SAVE_AMOUNT = 1;
const SAVE_THRESHOLD = 1000;

function DragHandle() {
	const { top } = useSafeAreaInsets();
	return (
		<View
			style={{
				width: "100%",
				alignItems: "center",
				paddingVertical: 12,
				backgroundColor: "white",
				paddingTop: top,
			}}
		>
			<View style={styles.dragHandle} />
		</View>
	);
}

function ProductHeader() {
	return (
		<View style={styles.productHeader}>
			<View style={styles.companyInfo}>
				<View style={styles.companyLogo} />
				<View>
					<Text style={styles.companyName}>Company name</Text>
					<Text style={styles.companyMeta}>Misc</Text>
				</View>
			</View>
			<FontAwesome6 name="ellipsis" size={24} color="black" />
		</View>
	);
}

function Rating() {
	return (
		<View style={styles.ratingRow}>
			<View style={styles.ratingStars}>
				{Array.from({ length: 5 }).map((_, index) => (
					<AntDesign
						key={index.toString()}
						name="star"
						size={12}
						color="black"
					/>
				))}
			</View>
			<Text style={styles.ratingCount}>3 ratings</Text>
		</View>
	);
}

function PriceRow() {
	return (
		<>
			<Text style={styles.priceText}>${PRICE}</Text>
			<View style={styles.savingsRow}>
				<View style={styles.savingsPill}>
					<Text style={styles.savingsPillText}>Save ${SAVE_AMOUNT}</Text>
				</View>
				<Text style={styles.savingsMeta}>On orders over ${SAVE_THRESHOLD}</Text>
			</View>
		</>
	);
}

function PurchaseButtons() {
	return (
		<View style={styles.purchaseRow}>
			<View style={styles.primaryButton}>
				<Text style={styles.primaryButtonText}>Buy now</Text>
			</View>
			<View style={styles.secondaryButton}>
				<Text style={styles.secondaryButtonText}>Buy now</Text>
			</View>
		</View>
	);
}

function Description() {
	return (
		<View>
			<Text style={styles.descriptionTitle}>Description</Text>
			<Text style={styles.descriptionText}>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Temporibus,
				aspernatur! Quibusdam, accusamus. Dignissimos cumque, velit saepe
				adipisci quod eaque, voluptate voluptates beatae, nihil dolorum impedit
				explicabo veritatis.
			</Text>
			<Text style={styles.descriptionText}>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Temporibus,
				aspernatur! Quibusdam, accusamus. Dignissimos cumque, velit saepe
				adipisci quod eaque, voluptate voluptates beatae, nihil dolorum impedit
				explicabo veritatis.
			</Text>
			<Text style={styles.descriptionText}>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Temporibus,
				aspernatur! Quibusdam, accusamus. Dignissimos cumque, velit saepe
				adipisci quod eaque, voluptate voluptates beatae, nihil dolorum impedit
				explicabo veritatis.
			</Text>
			<Text style={styles.descriptionText}>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Temporibus,
				aspernatur! Quibusdam, accusamus. Dignissimos cumque, velit saepe
				adipisci quod eaque, voluptate voluptates beatae, nihil dolorum impedit
				explicabo veritatis.
			</Text>
		</View>
	);
}

function SharedImage({
	id,
	image,
	placeholder,
	size,
}: {
	id: string;
	image: string;
	placeholder: string;
	size: number;
}) {
	return (
		<Transition.View
			sharedBoundTag={id}
			style={[
				styles.sharedImage,
				{ width: size, height: size, marginVertical: 24 },
			]}
		>
			<Image
				source={image}
				placeholder={{ blurhash: placeholder }}
				style={styles.sharedImageContent}
				contentFit="cover"
			/>
		</Transition.View>
	);
}

export default function ImageDetail() {
	const { id, image, placeholder } = useLocalSearchParams<{
		id: string;
		image: string;
		placeholder: string;
	}>();

	const { width } = useWindowDimensions();

	const imageSize = width * 0.9;

	return (
		<MaskedView
			style={styles.maskedView}
			maskElement={
				<Transition.View styleId={"masked-view"} style={[styles.maskElement]} />
			}
		>
			<Transition.View>
				<DragHandle />
				<Transition.ScrollView
					contentContainerStyle={[styles.scrollContent]}
					style={[styles.scroll, { backgroundColor: "white" }]}
				>
					<ProductHeader />
					<SharedImage
						id={id}
						image={image}
						placeholder={placeholder}
						size={imageSize}
					/>
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text style={styles.productTitle}>
								Hello, hi, product name goes here.
							</Text>
							<Rating />
						</View>
						<PriceRow />
						<View style={styles.card}>
							<View>
								<Text style={styles.planTitle}>One time purchase</Text>
								<Text style={styles.planPrice}>${PRICE}</Text>
							</View>
							<PurchaseButtons />
						</View>
						<Description />
					</View>
				</Transition.ScrollView>
			</Transition.View>
		</MaskedView>
	);
}

const styles = StyleSheet.create({
	maskedView: {
		flex: 1,
	},
	maskElement: {
		backgroundColor: "black",
	},
	scroll: {
		backgroundColor: "#f9fafb",
	},
	scrollContent: {
		alignItems: "center",
		gap: 8,
		padding: 24,
		paddingBottom: 100,
	},
	dragHandle: {
		backgroundColor: "#d1d5db",
		width: 30,
		height: 5,
		borderRadius: 100,
	},
	productHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
	},
	companyInfo: {
		flexDirection: "row",
		gap: 4,
		alignItems: "center",
	},
	companyLogo: {
		width: 50,
		height: 50,
		backgroundColor: "#e4e4e7",
		borderRadius: 12,
	},
	companyName: {
		fontSize: 14,
		color: "black",
		fontWeight: "600",
	},
	companyMeta: {
		fontSize: 12,
		color: "gray",
		fontWeight: "500",
	},
	sharedImage: {
		backgroundColor: "#eee",
		borderRadius: 24,
		overflow: "hidden",
		position: "relative",
		zIndex: 1900,
	},
	sharedImageContent: {
		width: "100%",
		height: "100%",
	},
	section: {
		width: "100%",
		gap: 12,
	},
	sectionHeader: {
		gap: 4,
	},
	productTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	ratingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	ratingStars: {
		flexDirection: "row",
		alignItems: "center",
	},
	ratingCount: {
		fontSize: 12,
		color: "gray",
		fontWeight: "600",
	},
	priceText: {
		fontSize: 16,
		fontWeight: "600",
	},
	savingsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	savingsPill: {
		paddingHorizontal: 6,
		paddingVertical: 4,
		backgroundColor: "#84cc16",
		borderRadius: 10,
	},
	savingsPillText: {
		fontSize: 12,
		color: "white",
		fontWeight: "600",
	},
	savingsMeta: {
		fontSize: 11,
		color: "#84cc16",
		fontWeight: "600",
	},
	card: {
		padding: 12,
		borderRadius: 24,
		borderColor: "#e5e7eb",
		borderWidth: 0.5,
		gap: 12,
	},
	planTitle: {
		fontSize: 15,
		fontWeight: "600",
	},
	planPrice: {
		fontSize: 13,
		color: "gray",
		fontWeight: "500",
	},
	primaryButton: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		flex: 1,
		backgroundColor: "black",
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonText: {
		fontSize: 16,
		color: "white",
		fontWeight: "600",
	},
	secondaryButton: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		flex: 1,
		backgroundColor: "#84cc16",
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryButtonText: {
		fontSize: 16,
		color: "white",
		fontWeight: "600",
	},
	purchaseRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	descriptionTitle: {
		fontSize: 14,
		fontWeight: "600",
	},
	descriptionText: {
		fontSize: 12,
		color: "gray",
		fontWeight: "500",
	},
});
