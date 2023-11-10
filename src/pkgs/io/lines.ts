import * as fs from "fs";
import * as readline from "readline";
import {ismain} from "../internal/index.js";
import {asyncenumerate} from "../enumerate.js";

export async function* lines(fp: string): AsyncGenerator<string, void> {
	const inf = readline.createInterface({
		input: fs.createReadStream(fp),
		terminal: false,
	});

	let resolve: () => void;
	const psmaker = () => {
		return new Promise<void>((r) => {
			resolve = r;
		});
	};

	let ps = psmaker();
	const tmp = [] as string[];

	inf.on("line", (l) => {
		tmp.push(l);
		resolve();
		ps = psmaker();
	});

	let closed = false;
	inf.on("close", () => closed = true);

	while (true) {
		if (closed) {
			if (tmp.length > 0) {
				yield* tmp as any;
			}
			break;
		}

		await ps;
		yield* tmp as any;
		tmp.length = 0;
	}
}

if (ismain(import.meta)) {
	for await (const [idx, line] of asyncenumerate(lines("./.swcrc"))) {
		console.log(idx, line);
	}
}
