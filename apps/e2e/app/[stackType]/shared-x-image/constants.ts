export const X_POST_IDS = ["28", "29", "74", "87", "120", "121"] as const;

export const getXPostImageUrl = (id: string) =>
	`https://picsum.photos/id/${id}/600/900`;
