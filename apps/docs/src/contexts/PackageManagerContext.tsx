import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

interface PackageManagerContextValue {
	packageManager: PackageManager;
	setPackageManager: (pm: PackageManager) => void;
}

const PackageManagerContext = createContext<PackageManagerContextValue>({
	packageManager: "npm",
	setPackageManager: () => {},
});

const STORAGE_KEY = "preferred-package-manager";

export function PackageManagerProvider({ children }: { children: ReactNode }) {
	const [packageManager, setPackageManagerState] =
		useState<PackageManager>("npm");

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
			if (stored && ["npm", "pnpm", "yarn", "bun"].includes(stored)) {
				setPackageManagerState(stored);
			}
		} catch {
			// localStorage not available
		}
	}, []);

	const setPackageManager = useCallback((pm: PackageManager) => {
		setPackageManagerState(pm);
		try {
			localStorage.setItem(STORAGE_KEY, pm);
		} catch {
			// localStorage not available
		}
	}, []);

	return (
		<PackageManagerContext.Provider
			value={{ packageManager, setPackageManager }}
		>
			{children}
		</PackageManagerContext.Provider>
	);
}

export function usePackageManager() {
	return useContext(PackageManagerContext);
}
