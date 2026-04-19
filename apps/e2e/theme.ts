import { useColorScheme } from "react-native";

export type Theme = {
	bg: string;
	card: string;
	cardPressed: string;
	text: string;
	textSecondary: string;
	textTertiary: string;
	headerBackButton: string;
	scenario: string;
	/** Tinted info boxes (structure, notes, etc.) */
	infoBox: string;
	infoBoxLabel: string;
	infoBorder: string;
	/** Note/warning boxes */
	noteBox: string;
	noteText: string;
	noteBorder: string;
	/** Action buttons */
	actionButton: string;
	actionButtonPressed: string;
	actionButtonText: string;
	/** Secondary/ghost action buttons */
	secondaryButton: string;
	secondaryButtonPressed: string;
	secondaryButtonText: string;
	/** Tab bar / overlay */
	tabBarBg: string;
	tabBarActive: string;
	/** Separator lines */
	separator: string;
	/** Surface cards (component stack floating cards) */
	surface: string;
	surfaceElevated: string;
	/** Handle indicator */
	handle: string;
	/** Active/selected pill */
	activePill: string;
	activePillText: string;
	pill: string;
	pillText: string;
};

const light: Theme = {
	bg: "#FFFFFF",
	card: "#F2F2F7",
	cardPressed: "#E8E8ED",
	text: "#000000",
	textSecondary: "#6E6E73",
	textTertiary: "#AEAEB2",
	headerBackButton: "rgba(0,0,0,0.06)",
	scenario: "#48484A",
	infoBox: "rgba(0,0,0,0.03)",
	infoBoxLabel: "#6E6E73",
	infoBorder: "rgba(0,0,0,0.06)",
	noteBox: "rgba(0,0,0,0.03)",
	noteText: "#6E6E73",
	noteBorder: "rgba(0,0,0,0.06)",
	actionButton: "#000000",
	actionButtonPressed: "#1C1C1E",
	actionButtonText: "#FFFFFF",
	secondaryButton: "rgba(0,0,0,0.06)",
	secondaryButtonPressed: "rgba(0,0,0,0.1)",
	secondaryButtonText: "#000000",
	tabBarBg: "rgba(255,255,255,0.92)",
	tabBarActive: "#000000",
	separator: "rgba(0,0,0,0.06)",
	surface: "#F2F2F7",
	surfaceElevated: "#E5E5EA",
	handle: "#C7C7CC",
	activePill: "#000000",
	activePillText: "#FFFFFF",
	pill: "rgba(0,0,0,0.06)",
	pillText: "#6E6E73",
};

const dark: Theme = {
	bg: "#08080C",
	card: "#141418",
	cardPressed: "#1C1C22",
	text: "#F5F5F7",
	textSecondary: "#8E8E93",
	textTertiary: "#636366",
	headerBackButton: "rgba(255,255,255,0.08)",
	scenario: "#8E8E93",
	infoBox: "rgba(255,255,255,0.04)",
	infoBoxLabel: "#8E8E93",
	infoBorder: "rgba(255,255,255,0.06)",
	noteBox: "rgba(255,255,255,0.04)",
	noteText: "#8E8E93",
	noteBorder: "rgba(255,255,255,0.06)",
	actionButton: "#F5F5F7",
	actionButtonPressed: "#E5E5EA",
	actionButtonText: "#000000",
	secondaryButton: "rgba(255,255,255,0.08)",
	secondaryButtonPressed: "rgba(255,255,255,0.14)",
	secondaryButtonText: "#F5F5F7",
	tabBarBg: "rgba(20,20,24,0.92)",
	tabBarActive: "#F5F5F7",
	separator: "rgba(255,255,255,0.06)",
	surface: "#141418",
	surfaceElevated: "#1C1C22",
	handle: "#48484A",
	activePill: "#F5F5F7",
	activePillText: "#000000",
	pill: "rgba(255,255,255,0.08)",
	pillText: "#8E8E93",
};

/**
 * Screen tints for demo/transition screens.
 * These are muted, pleasant colors that look good on both light and dark backgrounds.
 */
export const screenTints = {
	sage: "#3A5A40",
	lavender: "#4A3F6B",
	sand: "#5C5430",
	steel: "#2E4A5C",
	mauve: "#5C3A4A",
	indigo: "#4338CA",
	navy: "#1E3A5F",
} as const;

export function useTheme(): Theme {
	const scheme = useColorScheme();
	return scheme === "dark" ? dark : light;
}
