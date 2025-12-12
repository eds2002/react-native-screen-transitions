import { OnboardingScreen } from "@/components/onboarding-screen";

export default function HandleScreen() {
	return (
		<OnboardingScreen
			heading="Your handle"
			subtitle="P.S. We don't have a way to moderate yet."
			placeholder="@trpfsu"
			sharedElementAlign="flex-end"
			color="red"
		/>
	);
}
