declare global {
	interface ClassOf<T> {
		new (...args: any): T;
	}

	type Action = () => void | Promise<void>;
}
