type ThemeMode = "dark" | "light";

const themeOptions: Array<{ label: string; value: ThemeMode }> = [
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export function ThemeToggle() {
	return (
		<fieldset className="inline-flex rounded-md border border-black/10 bg-white p-1 dark:border-white/14 dark:bg-[#13191c]">
			<legend className="sr-only">Color theme</legend>
			{themeOptions.map((option) => (
				<button
					key={option.value}
					type="button"
					data-theme-option={option.value}
					aria-pressed={option.value === "dark" ? "true" : "false"}
					className='rounded-[6px] px-3 py-1.5 text-xs font-medium text-[#5c6d66] transition-colors duration-150 hover:text-[#111a16] dark:text-[#95a49f] dark:hover:text-[#eef4f1] [&[aria-pressed="true"]]:bg-[#0fa184]/10 [&[aria-pressed="true"]]:text-[#111a16] dark:[&[aria-pressed="true"]]:bg-[#7df0d7]/12 dark:[&[aria-pressed="true"]]:text-[#eef4f1] sm:text-sm'
				>
					{option.label}
				</button>
			))}
		</fieldset>
	);
}
