const THEME_STORAGE_KEY = "screen-transitions-docs-theme";

export function ThemeScript() {
	const script = `(function(){var key='${THEME_STORAGE_KEY}';function getStoredMode(){try{var mode=localStorage.getItem(key);return mode==='light'||mode==='dark'?mode:'dark';}catch(error){return'dark';}}function syncControls(mode){var buttons=document.querySelectorAll('[data-theme-option]');buttons.forEach(function(button){if(button instanceof HTMLElement){button.setAttribute('aria-pressed',button.dataset.themeOption===mode?'true':'false');}});}function applyTheme(mode,persist){document.documentElement.dataset.themeMode=mode;document.documentElement.dataset.theme=mode;document.documentElement.style.colorScheme=mode;syncControls(mode);if(persist){try{localStorage.setItem(key,mode);}catch(error){}}}function bindControls(){var buttons=document.querySelectorAll('[data-theme-option]');buttons.forEach(function(button){if(!(button instanceof HTMLElement)){return;}if(button.dataset.themeBound==='true'){return;}button.dataset.themeBound='true';button.addEventListener('click',function(){var mode=button.dataset.themeOption;if(mode==='light'||mode==='dark'){applyTheme(mode,true);}});});syncControls(getStoredMode());}applyTheme(getStoredMode(),false);if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',bindControls,{once:true});}else{bindControls();}})();`;

	// biome-ignore lint/security/noDangerouslySetInnerHtml: This inline script must run before hydration to apply the saved theme without a flash.
	return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
