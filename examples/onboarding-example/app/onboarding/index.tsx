import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef } from "react";
import { type TextInput, View } from "react-native";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { Typography } from "@/components/typography";
import { useFocusInput } from "@/hooks/use-focus-input";

export default function App() {
	const { ref } = useFocusInput();
	return (
		<Container>
			<View style={{ gap: 48 }}>
				<View>
					<Typography.Heading>Your handle</Typography.Heading>
					<Typography.Subtitle>
						P.S. We don't have a way to moderate yet.
					</Typography.Subtitle>
				</View>
				<Input ref={ref} placeholder="@trpfsu" />
			</View>
		</Container>
	);
}
