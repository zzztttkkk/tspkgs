import { inspect } from "util";
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
			)} is not a function`,
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
	value: function (src: any, hint?: __pkgs.NumberTransformHint): number {
		switch (typeof src) {
			case "string": {
				return src.includes(".")
					? Number.parseFloat(src)
					: Number.parseInt(src, hint?.radix);
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
				throw new Error(`${inspect(src, false, 1)} can not transfor to Number`);
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

const truths = ["TRUE", "T", "1"];

let DefaultBoolTransformHint: __pkgs.BooleanTransformHint = { directly: true };

export function SetDefaultBoolTransformHint(opts: __pkgs.BooleanTransformHint) {
	DefaultBoolTransformHint = opts;
}

Object.defineProperty(Boolean, TransformSymbol, {
	configurable: false,
	writable: false,
	enumerable: false,
	value: function (src: any, hint?: __pkgs.BooleanTransformHint): boolean {
		hint = hint || DefaultBoolTransformHint;

		if (hint?.directly) return Boolean(src);

		const type = typeof src;

		if (type === "boolean") return src;
		if (type === "number" || type === "bigint") return Boolean(src);

		const val = type == "string" ? src : transform(src, String);
		const _ts = (hint?.truths || truths) as string[];
		if (hint?.casesensitive) return _ts.includes(val);
		const uv = val.toUpperCase();
		return __.Any(_ts, (v) => v.toUpperCase() === uv);
	},
});
