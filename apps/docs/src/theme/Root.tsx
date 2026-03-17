import React, { type ReactNode } from "react";
import { PackageManagerProvider } from "../contexts/PackageManagerContext";

interface RootProps {
	children: ReactNode;
}

export default function Root({ children }: RootProps) {
	return <PackageManagerProvider>{children}</PackageManagerProvider>;
}
