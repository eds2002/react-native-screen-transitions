import { OnboardingScreen } from "@/components/onboarding-screen";

export default function BioScreen() {
	return (
		<OnboardingScreen
			heading="Bio"
			subtitle="We aim to invade your privacy"
			placeholder="Tell us about yourself..."
			sharedElementAlign="center"
			color="purple"
		/>
	);
}
