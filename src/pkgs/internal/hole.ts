import * as path from "path";
import * as url from "url";
import { ismain } from "./index.js";

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

if (ismain(import.meta)) {
	const hole = new Hole<() => void>(import.meta, "Hole");
	hole.fill(() => {
		console.log(1);
	});
	hole.expose()();
}
