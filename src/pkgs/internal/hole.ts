import * as path from "path";
import * as url from "url";

export class Hole<T> {
	private static insmap = new Map<string, Hole<any>>();

	private readonly name: string;
	private val: T | undefined = undefined;

	constructor(meta: ImportMeta, name: string) {
		this.name = `./${path
			.relative(process.cwd(), url.fileURLToPath(meta.url))
			.replaceAll(path.sep, "/")}#${name}`;
		Hole.insmap.set(this.name, this);
	}

	fill(v: T) {
		this.val = v;
	}

	expose(): T {
		if (this.val == null) {
			throw new Error(`unfilled hole: ${this.name}`);
		}
		return this.val;
	}

	get content(): T {
		return this.expose();
	}

	static check() {
		for (const ins of this.insmap.values()) {
			ins.expose();
		}
	}
}

export namespace tspkgs {
	export const holes = {
		ReflectionRegisterBind: new Hole<(...args: any[]) => any>(import.meta, ""),
		ReflectionRegisterMerge: new Hole<(...args: any[]) => any>(import.meta, ""),
	};
}
