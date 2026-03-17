function tailwindPlugin() {
	return {
		name: "tailwind-plugin",
		configurePostCss(postcssOptions) {
			postcssOptions.plugins.unshift(require("postcss-import"));
			postcssOptions.plugins.push(require("tailwindcss"));
			postcssOptions.plugins.push(require("autoprefixer"));

			return postcssOptions;
		},
	};
}

module.exports = tailwindPlugin;
