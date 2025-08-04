import Page from "@/components/page";

export default function SlideFromTopPreset() {
	return (
		<Page
			title="Slide From Top"
			description="This preset creates a slide-in animation from the top of the screen with gesture support. Swipe up to go back."
			backIcon={"chevron-up"}
			contentContainerStyle={{
				alignItems: "center",
				justifyContent: "center",
				paddingTop: 0,
				flex: 1,
			}}
		/>
	);
}
