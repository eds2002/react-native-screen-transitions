import { forwardRef, type Ref } from "react";
import { TextInput, type TextInputProps } from "react-native";

export const Input = forwardRef(
	({ style, ...props }: TextInputProps, ref: Ref<TextInput>) => {
		return (
			<TextInput
				ref={ref}
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
	},
);
