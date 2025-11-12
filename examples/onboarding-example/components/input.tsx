import { TextInput, type TextInputProps } from "react-native";

export const Input = ({ style, ...props }: TextInputProps) => {
	return (
		<TextInput
			style={[
				{
					backgroundColor: "#f5f5f5",
					padding: 16,
					borderRadius: 99,
					fontSize: 16,
					fontWeight: 500,
				},
				style,
			]}
			{...props}
		/>
	);
};
