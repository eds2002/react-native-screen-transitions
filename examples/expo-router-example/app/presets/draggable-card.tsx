import Page from "@/components/page";

export default function DraggableCardPreset() {
	return (
		<Page
			title="Draggable Card"
			description="A draggable card that can be dragged either horizontally or vertically. Similar to instagram reels."
			backIcon={"xmark"}
			style={{
				backgroundColor: "white",
				flex: 1,
			}}
			contentContainerStyle={{
				alignItems: "center",
				justifyContent: "center",
				paddingTop: 0,
				flex: 1,
			}}
		/>
	);
}
