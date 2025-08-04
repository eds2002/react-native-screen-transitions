import Page from "@/components/page";

export default function ZoomInPreset() {
	return (
		<Page
			title="Zoom In"
			description="This preset creates a zoom animation where the focused screen zooms in while unfocused screens zoom out."
			backIcon={"xmark"}
			contentContainerStyle={{
				alignItems: "center",
				justifyContent: "center",
				paddingTop: 0,
				flex: 1,
			}}
		/>
	);
}
