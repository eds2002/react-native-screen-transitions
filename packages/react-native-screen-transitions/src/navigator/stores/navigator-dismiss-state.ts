const map = new Map<string, boolean>();

export const NavigatorDismissState = {
	get(id: string | undefined): boolean {
		if (!id) return false;
		return map.get(id) === true;
	},
	set(id: string, val: boolean) {
		map.set(id, !!val);
	},
	remove(id: string) {
		map.delete(id);
	},
	clear() {
		map.clear();
	},
};
