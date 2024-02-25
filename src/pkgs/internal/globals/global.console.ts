declare global {
	interface Console {
		json(v: any): void;
	}
}

(console as any).json = function (v: any) {
	console.log(JSON.stringify(v, null, 2));
};
