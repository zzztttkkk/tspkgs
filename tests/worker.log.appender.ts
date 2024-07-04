import { isMainThread } from "worker_threads";
import { TypedWorker, Work } from "../src/index.js";
import { AsyncFileAppender } from "../src/pkgs/logging/fs.appender.js";
import { source } from "../src/pkgs/internal/index.js";

interface In {
	log?: {
		at: number;
		txt: string;
	};
	close?: boolean;
}

let worker: TypedWorker<In, void> | undefined;

export function append(at: number, log: string): Promise<void> {
	worker!.exec({ log: { at, txt: log } });
	return Promise.resolve();
}

export async function close() {
	await worker!.exec({ close: true });
	await worker!.close();
}

if (isMainThread) {
	worker = new TypedWorker<In, void>(source(import.meta));
} else {
	const fa = new AsyncFileAppender("./xxx.log", {
		rotation: "minutely",
	});

	Work<In, void>(async (args) => {
		if (args.close) {
			await fa.close();
			return;
		}
		await fa.append(args.log!.at, args.log!.txt);
	});
}
