import { inspect } from "node:util";
import { __ } from "../internal/index.js";

const TransformSymbol = Symbol("pkgs:transform");

Object.defineProperty(Symbol, "transform", {
	value: TransformSymbol,
	writable: false,
	configurable: false,
});

function transform<T>(src: any, cls: ClassOf<T>, hint?: any): T {
	const fn = (cls as any)[TransformSymbol];
	if (typeof fn !== "function") {
		throw new Error(
			`pkgs.transform: ${inspect(cls)}.${inspect(
				TransformSymbol,
			)} is not a function, note that it should be a static method`,
		);
	}
	return fn(src, hint);
}

Object.defineProperty(global, "transform", {
	value: transform,
	writable: false,
	configurable: false,
});

Object.defineProperty(Number, TransformSymbol, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: (src: any, hint?: __pkgs.NumberTransformHint): number => {
		switch (typeof src) {
			case "string": {
				const num = src.includes(".")
					? Number.parseFloat(src)
					: Number.parseInt(src, hint?.radix);
				if (Number.isNaN(num)) throw new Error(`${src} is not a number`);
				return num;
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
				throw new Error(
					`${inspect(src, false, 1)} can not transform to Number`,
				);
			}
		}
	},
});

Object.defineProperty(String, TransformSymbol, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: (src: any): string => {
		if (typeof src === "undefined") {
			throw new Error(`can not transform undefined to String`);
		}
		return src.toString();
	},
});

const truths = ["TRUE", "true", "OK", "ok", "YES", "yes"];

let DefaultBoolTransformHint: __pkgs.BooleanTransformHint = { directly: true };

export function SetDefaultBoolTransformHint(opts: __pkgs.BooleanTransformHint) {
	DefaultBoolTransformHint = opts;
}

Object.defineProperty(Boolean, TransformSymbol, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: (src: any, hint?: __pkgs.BooleanTransformHint): boolean => {
		hint = hint || DefaultBoolTransformHint;

		if (hint?.directly) return Boolean(src);

		const type = typeof src;

		if (type === "boolean") return src;
		if (type === "number" || type === "bigint") return Boolean(src);

		const val = type === "string" ? src : transform(src, String);
		const _ts = (hint?.truths || truths) as string[];
		if (hint?.casesensitive) return _ts.includes(val);
		const uv = val.toUpperCase();
		return __.Any(_ts, (v) => v.toUpperCase() === uv);
	},
});

declare global {
	interface SymbolConstructor {
		transform: symbol;
	}
	namespace __pkgs {
		interface BooleanTransformHint {
			truths?: string[];
			casesensitive?: boolean;
			directly?: boolean;
		}

		interface NumberTransformHint {
			radix?: number;
		}
	}

	function transform(
		src: any,
		cls: NumberConstructor,
		hint?: __pkgs.NumberTransformHint,
	): number;
	function transform(
		src: any,
		cls: BooleanConstructor,
		hint?: __pkgs.BooleanTransformHint,
	): boolean;
	function transform<T>(src: any, cls: ClassOf<T>, hint?: any): T;
}
