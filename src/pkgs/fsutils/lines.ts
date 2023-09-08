import * as fs from "fs";
import * as readline from "readline";
import { ismain } from "../internal/index.js";

export async function* lines(fp: string): AsyncGenerator<string> {
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
	inf.on("close", () => {
		closed = true;
	});

	while (true) {
		if (closed) {
			yield* tmp as any;
			break;
		}
		await ps;
		yield* tmp as any;
		tmp.length = 0;
	}
}

if (ismain(import.meta)) {
	for await (const line of lines("./tsconfig.json")) {
		console.log(line);
	}
}
