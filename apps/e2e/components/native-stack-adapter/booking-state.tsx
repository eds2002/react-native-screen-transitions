import {
	createContext,
	type PropsWithChildren,
	use,
	useMemo,
	useState,
} from "react";

type BookingState = {
	travelers: number;
	setTravelers: (travelers: number) => void;
	seat: "window" | "aisle";
	setSeat: (seat: "window" | "aisle") => void;
	insurance: boolean;
	setInsurance: (insurance: boolean) => void;
};

const BookingContext = createContext<BookingState | null>(null);

export function BookingStateProvider({ children }: PropsWithChildren) {
	const [travelers, setTravelers] = useState(1);
	const [seat, setSeat] = useState<BookingState["seat"]>("window");
	const [insurance, setInsurance] = useState(false);
	const value = useMemo(
		() => ({
			travelers,
			setTravelers,
			seat,
			setSeat,
			insurance,
			setInsurance,
		}),
		[insurance, seat, travelers],
	);

	return <BookingContext value={value}>{children}</BookingContext>;
}

export function useBookingState() {
	const value = use(BookingContext);

	if (!value) {
		throw new Error("useBookingState must be used within BookingStateProvider");
	}

	return value;
}
