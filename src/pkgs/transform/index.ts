import { inspect } from "util";

const TransformSymbol = Symbol("pkgs:transform");

Object.defineProperty(Symbol, "transform", {
	value: TransformSymbol,
	writable: false,
	configurable: false,
});

function transform<T>(src: any, cls: new (...args: any) => T): T {
	const fn = (cls as any)[TransformSymbol];
	if (typeof fn !== "function") {
		throw new Error(
			`pkgs.transform: ${inspect(cls)}.${inspect(
				TransformSymbol,
			)} is not a function`,
		);
	}
	return fn(src);
}

Object.defineProperty(global || window, "transform", {
	value: transform,
	writable: false,
	configurable: false,
});

Object.defineProperty(Number, TransformSymbol, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: function (src: any): number {
		switch (typeof src) {
			case "string": {
				return src.includes(".")
					? Number.parseFloat(src)
					: Number.parseInt(src);
			}
			case "number": {
				return src;
			}
			case "bigint": {
				return Number(src);
			}
			case "boolean": {
				return src ? 1 : 0;
			}
			default: {
				throw new Error(`${inspect(src)} can not transfor to Number`);
			}
		}
	},
});

Object.defineProperty(String, TransformSymbol, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: function (src: any): string {
		if (src == null) return inspect(src);
		return src.toString();
	},
});

const truths = ["TRUE", "T", "OK", "1"];

Object.defineProperty(Boolean, TransformSymbol, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: function (src: any): boolean {
		const type = typeof src;
		if (type === "boolean") return src;
		const val = type == "string" ? src : transform(src, String);
		return truths.includes(val.toUpperCase());
	},
});
