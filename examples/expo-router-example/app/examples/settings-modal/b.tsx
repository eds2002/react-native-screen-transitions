import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import Transition from "react-native-screen-transitions";

const colors = {
	bg: "#fff",
	text: "#111",
	subtle: "#6b7280",
	border: "#e5e5e5",
	chipBg: "#eee",
	icon: "#000",
	chev: "#9ca3af",
};

function Header() {
	const router = useRouter();
	return (
		<View
			style={{
				backgroundColor: colors.bg,
				borderBottomWidth: 1,
				borderBottomColor: colors.border,
			}}
		>
			<View
				style={{
					height: 56,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: 16,
					backgroundColor: colors.bg,
				}}
			>
				<Pressable
					accessibilityRole="button"
					onPress={() => router.back()}
					style={{
						width: 30,
						height: 30,
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: colors.chipBg,
						borderRadius: 99,
					}}
				>
					<FontAwesome6 name="xmark" size={16} color="gray" />
				</Pressable>
				<Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }}>
					Composer Settings
				</Text>
				<View style={{ width: 30, height: 30 }} />
			</View>

			{/* Subheader tabs-like chips */}
			<View
				style={{
					flexDirection: "row",
					gap: 8,
					paddingHorizontal: 16,
					paddingBottom: 12,
				}}
			>
				<Chip label="General" selected />
				<Chip label="Inputs" />
				<Chip label="Shortcuts" />
			</View>
		</View>
	);
}

function Chip({
	label,
	selected = false,
}: {
	label: string;
	selected?: boolean;
}) {
	return (
		<View
			style={{
				paddingHorizontal: 10,
				height: 28,
				borderRadius: 999,
				alignItems: "center",
				justifyContent: "center",
				borderWidth: 1,
				borderColor: selected ? colors.text : colors.border,
				backgroundColor: selected ? "#f5f5f5" : colors.bg,
			}}
		>
			<Text
				style={{
					fontSize: 12,
					color: selected ? colors.text : colors.subtle,
					fontWeight: "600",
				}}
			>
				{label}
			</Text>
		</View>
	);
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
	return (
		<View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 }}>
			<Text
				style={{
					fontSize: 12,
					color: colors.subtle,
					letterSpacing: 1,
					fontWeight: "600",
				}}
			>
				{title.toUpperCase()}
			</Text>
			{desc ? (
				<Text style={{ marginTop: 6, fontSize: 13, color: colors.subtle }}>
					{desc}
				</Text>
			) : null}
		</View>
	);
}

function Row({ children }: { children: React.ReactNode }) {
	return (
		<View
			style={{
				backgroundColor: colors.bg,
				paddingHorizontal: 16,
				paddingVertical: 12,
				borderTopWidth: 1,
				borderTopColor: colors.border,
			}}
		>
			{children}
		</View>
	);
}

function LabeledInput(props: {
	iconName?: React.ComponentProps<typeof FontAwesome6>["name"];
	label: string;
	placeholder?: string;
	value: string;
	onChangeText: (v: string) => void;
}) {
	const { iconName = "pen", label, placeholder, value, onChangeText } = props;
	return (
		<View>
			<View
				style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
			>
				<View
					style={{
						width: 28,
						height: 28,
						borderRadius: 6,
						alignItems: "center",
						justifyContent: "center",
						borderWidth: 1,
						borderColor: colors.border,
						marginRight: 8,
						backgroundColor: colors.bg,
					}}
				>
					<FontAwesome6 name={iconName} size={12} color={colors.icon} />
				</View>
				<Text style={{ fontSize: 13, color: colors.subtle, fontWeight: "600" }}>
					{label}
				</Text>
			</View>
			<View
				style={{
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: 10,
					overflow: "hidden",
					backgroundColor: colors.bg,
				}}
			>
				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.subtle}
					style={{
						paddingHorizontal: 12,
						paddingVertical: 10,
						fontSize: 16,
						color: colors.text,
					}}
				/>
			</View>
		</View>
	);
}

function LabeledTextArea(props: {
	iconName?: React.ComponentProps<typeof FontAwesome6>["name"];
	label: string;
	placeholder?: string;
	value: string;
	onChangeText: (v: string) => void;
	rows?: number;
}) {
	const {
		iconName = "paragraph",
		label,
		placeholder,
		value,
		onChangeText,
		rows = 4,
	} = props;
	return (
		<View>
			<View
				style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
			>
				<View
					style={{
						width: 28,
						height: 28,
						borderRadius: 6,
						alignItems: "center",
						justifyContent: "center",
						borderWidth: 1,
						borderColor: colors.border,
						marginRight: 8,
						backgroundColor: colors.bg,
					}}
				>
					<FontAwesome6 name={iconName} size={12} color={colors.icon} />
				</View>
				<Text style={{ fontSize: 13, color: colors.subtle, fontWeight: "600" }}>
					{label}
				</Text>
			</View>
			<View
				style={{
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: 10,
					overflow: "hidden",
					backgroundColor: colors.bg,
				}}
			>
				<TextInput
					multiline
					numberOfLines={rows}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.subtle}
					style={{
						paddingHorizontal: 12,
						paddingVertical: 10,
						fontSize: 16,
						color: colors.text,
						minHeight: rows * 22,
						textAlignVertical: "top",
					}}
				/>
			</View>
		</View>
	);
}

function InlineToggle(props: {
	iconName?: React.ComponentProps<typeof FontAwesome6>["name"];
	label: string;
	desc?: string;
	value: boolean;
	onChange: (v: boolean) => void;
}) {
	const { iconName = "toggle-on", label, desc, value, onChange } = props;
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 12,
			}}
		>
			<View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
				<View
					style={{
						width: 30,
						height: 30,
						borderRadius: 6,
						alignItems: "center",
						justifyContent: "center",
						borderWidth: 1,
						borderColor: colors.border,
						backgroundColor: colors.bg,
						marginRight: 12,
					}}
				>
					<FontAwesome6 name={iconName} size={12} color={colors.icon} />
				</View>
				<View style={{ flex: 1 }}>
					<Text style={{ fontSize: 16, color: colors.text, fontWeight: "500" }}>
						{label}
					</Text>
					{desc ? (
						<Text style={{ color: colors.subtle, fontSize: 12, marginTop: 2 }}>
							{desc}
						</Text>
					) : null}
				</View>
			</View>
			<Switch
				value={value}
				onValueChange={onChange}
				thumbColor={value ? colors.text : "#f4f3f4"}
				trackColor={{ false: "#d1d5db", true: "#a3a3a3" }}
			/>
		</View>
	);
}

export default function B() {
	const [defaultFolder, setDefaultFolder] = useState("Projects/Notes");
	const [titleFormat, setTitleFormat] = useState("{date} - {slug}");
	const [snippet, setSnippet] = useState(
		"Meeting notes:\n- Attendees:\n- Agenda:\n- Action items:",
	);
	const [autoSave, setAutoSave] = useState(true);
	const [spellCheck, setSpellCheck] = useState(false);
	const [smartPunctuation, setSmartPunctuation] = useState(true);

	return (
		<View style={{ flex: 1, backgroundColor: colors.bg }}>
			<Header />
			<Transition.ScrollView
				contentContainerStyle={{
					paddingBottom: 24,
					backgroundColor: colors.bg,
				}}
				showsVerticalScrollIndicator={false}
				style={{ backgroundColor: colors.bg }}
			>
				{/* Editor Defaults */}
				<SectionTitle
					title="Editor Defaults"
					desc="Configure how new documents are created in the composer."
				/>
				<Row>
					<LabeledInput
						iconName="folder-open"
						label="Default Save Location"
						placeholder="e.g. Documents/Work"
						value={defaultFolder}
						onChangeText={setDefaultFolder}
					/>
				</Row>
				<Row>
					<LabeledInput
						iconName="heading"
						label="Title Format"
						placeholder="{date} - {title}"
						value={titleFormat}
						onChangeText={setTitleFormat}
					/>
				</Row>
				<Row>
					<LabeledTextArea
						iconName="align-left"
						label="Content Template"
						placeholder="Start typing your template..."
						value={snippet}
						onChangeText={setSnippet}
						rows={6}
					/>
				</Row>

				<View style={{ height: 12 }} />

				{/* Input Behaviors */}
				<SectionTitle
					title="Input Behaviors"
					desc="Toggle helpful features while typing."
				/>
				<Row>
					<InlineToggle
						iconName="floppy-disk"
						label="Auto Save"
						desc="Save changes automatically while editing"
						value={autoSave}
						onChange={setAutoSave}
					/>
				</Row>
				<Row>
					<InlineToggle
						iconName="spell-check"
						label="Spell Check"
						desc="Underline misspelled words"
						value={spellCheck}
						onChange={setSpellCheck}
					/>
				</Row>
				<Row>
					<InlineToggle
						iconName="quote-left"
						label="Smart Punctuation"
						desc="Automatically convert straight quotes to curly"
						value={smartPunctuation}
						onChange={setSmartPunctuation}
					/>
				</Row>

				<View style={{ height: 12 }} />

				{/* Quick Actions */}
				<SectionTitle
					title="Quick Actions"
					desc="One-tap utilities for your composer."
				/>
				<Row>
					<ActionGrid />
				</Row>
			</Transition.ScrollView>
		</View>
	);
}

function ActionGrid() {
	const actions = [
		{ icon: "broom", label: "Clear Draft" },
		{ icon: "file-arrow-down", label: "Export" },
		{ icon: "paste", label: "Paste from Clipboard" },
		{ icon: "magic", label: "Format" },
		{ icon: "magnifying-glass", label: "Find" },
		{ icon: "gear", label: "Advanced" },
	] as const;

	return (
		<View
			style={{
				flexDirection: "row",
				flexWrap: "wrap",
				marginHorizontal: -6,
				rowGap: 12,
			}}
		>
			{actions.map((a) => (
				<View key={a.label} style={{ width: "33.333%", paddingHorizontal: 6 }}>
					<View
						style={{
							borderWidth: 1,
							borderColor: colors.border,
							borderRadius: 12,
							alignItems: "center",
							justifyContent: "center",
							paddingVertical: 16,
							backgroundColor: colors.bg,
							gap: 8,
						}}
					>
						<View
							style={{
								width: 36,
								height: 36,
								borderRadius: 8,
								alignItems: "center",
								justifyContent: "center",
								borderWidth: 1,
								borderColor: colors.border,
								backgroundColor: colors.bg,
							}}
						>
							<FontAwesome6 name={a.icon} size={14} color={colors.icon} />
						</View>
						<Text
							style={{
								fontSize: 12,
								color: colors.text,
								textAlign: "center",
								paddingHorizontal: 6,
							}}
							numberOfLines={2}
						>
							{a.label}
						</Text>
					</View>
				</View>
			))}
		</View>
	);
}
