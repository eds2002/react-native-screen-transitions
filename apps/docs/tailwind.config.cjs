/** @type {import('tailwindcss').Config} */
module.exports = {
	corePlugins: {
		preflight: false,
		container: false,
	},
	important: "#__docusaurus",
	darkMode: ["class", '[data-theme="dark"]'],
	content: [
		"./src/**/*.{js,jsx,ts,tsx,md,mdx}",
		"./docs/**/*.{md,mdx}",
		"./blog/**/*.{md,mdx}",
	],
	theme: {
		extend: {},
	},
	plugins: [],
};
