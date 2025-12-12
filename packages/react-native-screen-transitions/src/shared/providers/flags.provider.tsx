import createProvider from "../utils/create-provider";

interface FlagsValue {
	TRANSITIONS_ALWAYS_ON: boolean;
}

interface FlagsProviderProps {
	TRANSITIONS_ALWAYS_ON?: boolean;
	children: React.ReactNode;
}

const { FlagsProvider, useFlagsContext } = createProvider("Flags", {
	guarded: false,
})<FlagsProviderProps, FlagsValue>(
	({ TRANSITIONS_ALWAYS_ON = false, children }) => ({
		value: { TRANSITIONS_ALWAYS_ON },
		children,
	}),
);

export { FlagsProvider, useFlagsContext };
