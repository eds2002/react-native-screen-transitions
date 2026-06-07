import {
	Fragment,
	memo,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import { PortalHost as NativePortalHost } from "react-native-teleport";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import createProvider from "../../../../utils/create-provider";
import { createTransitionAwareComponent } from "../../../create-transition-aware-component";
import { createPortalHostName } from "../utils";

const TransitionAwarePortalHost =
	createTransitionAwareComponent(NativePortalHost);

type PortalHostProviderProps = {
	children: ReactNode;
};

type PortalHostContextValue = {
	hasCustomHost: boolean;
	registerCustomHost: () => () => void;
};

type PortalHostProps = {
	children?: ReactNode;
	name?: string;
	replaceDefault?: boolean;
	style?: StyleProp<ViewStyle>;
	styleId?: string;
};

export const {
	PortalHostProvider,
	usePortalHostOptionalStore,
	usePortalHostStore,
} = createProvider("PortalHost", { guarded: false })<
	PortalHostProviderProps,
	PortalHostContextValue
>(({ children }) => {
	const [hasCustomHost, setHasCustomHost] = useState(false);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const hostName = createPortalHostName(currentScreenKey);

	const registerCustomHost = useCallback(() => {
		let didUnregister = false;
		setHasCustomHost(true);

		return () => {
			if (didUnregister) {
				return;
			}

			didUnregister = true;
			setHasCustomHost(false);
		};
	}, []);

	const value = useMemo(
		() => ({
			hasCustomHost,
			registerCustomHost,
		}),
		[hasCustomHost, registerCustomHost],
	);

	return {
		value,
		children: (
			<Fragment>
				{children}
				{!hasCustomHost ? (
					<TransitionAwarePortalHost
						style={StyleSheet.absoluteFill}
						name={hostName}
						styleId={hostName}
					/>
				) : null}
			</Fragment>
		),
	};
});

export const PortalHost = memo(function PortalHost({ style }: PortalHostProps) {
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const registerCustomHost = usePortalHostOptionalStore(
		(value) => value?.registerCustomHost,
	);
	const hostName = createPortalHostName(currentScreenKey);

	useLayoutEffect(() => {
		if (!registerCustomHost) {
			return;
		}

		return registerCustomHost();
	}, [registerCustomHost]);

	return (
		<TransitionAwarePortalHost
			style={[StyleSheet.absoluteFill, style]}
			name={hostName}
			styleId={hostName}
		/>
	);
});
