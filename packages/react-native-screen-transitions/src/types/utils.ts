export type Any = any;

export type Complete<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };
