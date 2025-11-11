export function flattenStyle<TStyleProp>(style: TStyleProp): TStyleProp {
	"worklet";
	if (style === null || typeof style !== "object") {
		return style;
	}

	if (!Array.isArray(style)) {
		return style;
	}

	const result: { [key: string]: TStyleProp } = {};
	for (let i = 0, styleLength = style.length; i < styleLength; ++i) {
		const computedStyle = flattenStyle(style[i]);
		if (computedStyle) {
			for (const key in computedStyle) {
				result[key] = computedStyle[key];
			}
		}
	}
	return result as TStyleProp;
}
