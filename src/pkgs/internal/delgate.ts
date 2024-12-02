import * as path from "node:path";
import * as url from "node:url";

class DelgateCls<T extends Function> {
	private readonly delgatename: string;
	private val: T | undefined = undefined;

	constructor(meta: ImportMeta, name: string) {
		this.delgatename = `./${path
			.relative(process.cwd(), url.fileURLToPath(meta.url))
			.replaceAll(path.sep, "/")}#${name}`;
	}

	fill(v: T) {
		this.val = v;
	}

	private expose(): T {
		if (this.val == null) {
			throw new Error(`unfilled hole: ${this.delgatename}`);
		}
		return this.val;
	}

	func(): T & { fill: (fn: T) => void; } {
		const fnc = (...args: any) => this.expose()(...args);
		Object.defineProperty(
			fnc,
			"fill",
			{
				value: (v: T) => this.fill(v),
				writable: false
			}
		)
		return fnc as any;
	}
}

export namespace tspkgs {
	export const holes = {
		ReflectionRegisterBind: new DelgateCls<(...args: any[]) => any>(import.meta, "bind").func(),
		ReflectionRegisterMerge: new DelgateCls<(...args: any[]) => any>(import.meta, "merge").func(),
	};
}

export function Delgate<T extends Function>(meta: ImportMeta, name: string): T {
	return new DelgateCls<T>(meta, name).func();
}