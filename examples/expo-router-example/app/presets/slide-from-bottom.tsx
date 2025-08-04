import Page from "@/components/page";

export default function SlideFromBottomPreset() {
	return (
		<Page
			title="Slide From Bottom"
			description="This preset creates a slide-in animation from the bottom of the screen with vertical gesture support."
			backIcon={"chevron-down"}
			contentContainerStyle={{
				alignItems: "center",
				justifyContent: "center",
				paddingTop: 0,
				flex: 1,
			}}
		/>
	);
}
