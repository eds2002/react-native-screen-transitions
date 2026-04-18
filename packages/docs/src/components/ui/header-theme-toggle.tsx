import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "screen-transitions-docs-theme";
const themeCycleOrder: ThemeMode[] = ["dark", "light"];

function MoonIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="h-4.5 w-4.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="10" cy="10" r="6.25" />
			<path
				d="M10 3.75a6.25 6.25 0 0 0 0 12.5Z"
				fill="currentColor"
				stroke="none"
			/>
		</svg>
	);
}

function SunIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 20 20"
			className="h-4.5 w-4.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="10" cy="10" r="3.25" />
			<path d="M10 1.75v2.1" />
			<path d="M10 16.15v2.1" />
			<path d="m4.17 4.17 1.48 1.48" />
			<path d="m14.35 14.35 1.48 1.48" />
			<path d="M1.75 10h2.1" />
			<path d="M16.15 10h2.1" />
			<path d="m4.17 15.83 1.48-1.48" />
			<path d="m14.35 5.65 1.48-1.48" />
		</svg>
	);
}

function getStoredMode(): ThemeMode {
	try {
		const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);

		return storedMode === "light" || storedMode === "dark"
			? storedMode
			: "dark";
	} catch {
		return "dark";
	}
}

function getCurrentMode(): ThemeMode {
	const mode = document.documentElement.dataset.theme;

	return mode === "light" || mode === "dark" ? mode : getStoredMode();
}

function applyTheme(mode: ThemeMode) {
	const root = document.documentElement;

	root.dataset.themeMode = mode;
	root.dataset.theme = mode;
	root.style.colorScheme = mode;

	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, mode);
	} catch {}
}

function getNextMode(mode: ThemeMode) {
	const index = themeCycleOrder.indexOf(mode);

	return themeCycleOrder[(index + 1) % themeCycleOrder.length];
}

export function HeaderThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("dark");

	useEffect(() => {
		setMode(getCurrentMode());

		const observer = new MutationObserver(() => {
			setMode(getCurrentMode());
		});

		observer.observe(document.documentElement, {
			attributeFilter: ["data-theme", "data-theme-mode"],
			attributes: true,
		});

		return () => {
			observer.disconnect();
		};
	}, []);

	const nextMode = getNextMode(mode);

	return (
		<button
			type="button"
			aria-label={`Theme mode: ${mode}. Click to switch to ${nextMode}.`}
			title={`Theme: ${mode}`}
			onClick={() => {
				applyTheme(nextMode);
				setMode(nextMode);
			}}
			className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
		>
			{mode === "dark" ? <MoonIcon /> : <SunIcon />}
		</button>
	);
}
