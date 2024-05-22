import path from "path";
import { isMainThread } from "worker_threads";
import { TypedWorker, Work } from "../src/index.js";
import { AsyncFileAppender } from "../src/pkgs/logging/fs.appender.js";

interface In {
	log?: {
		at: number;
		txt: string;
	};
	close?: boolean;
}

let worker: TypedWorker<In, void>;
let fa: AsyncFileAppender;

if (isMainThread) {
	worker = new TypedWorker<In, void>(
		`${path.dirname(import.meta.filename)}/worker.log.appender.js`,
	);
} else {
	fa = new AsyncFileAppender("./xxx.log", {
		rotation: "minutely",
	});

	Work<In, void>(async (args) => {
		if (args.close) {
			await fa.close();
			return;
		}
		if (args.log) {
			await fa.append(args.log.at, args.log.txt);
		}
	});
}

export function append(at: number, log: string): Promise<void> {
	worker.exec({ log: { at, txt: log } });
	return Promise.resolve();
}

export async function close() {
	await worker.exec({ close: true });
	await worker.close();
}
