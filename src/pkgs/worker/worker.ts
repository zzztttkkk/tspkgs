import { Worker, parentPort } from "worker_threads";

interface Msg<T> {
	idx: bigint;
	data: T;
	err?: Error;
}

interface Waiter<T> {
	resolve: (v: T) => void;
	reject: (e: Error | any) => void;
}

export class TypedWorker<Input, Output> {
	private worker: Worker;
	private waiters: Map<bigint, Waiter<Output>>;
	private idx: bigint;

	constructor(file: string) {
		this.idx = BigInt(0);
		this.waiters = new Map();
		this.worker = new Worker(file);
		this.worker.on("message", (msg: Msg<Output>) => {
			const ps = this.waiters.get(msg.idx);
			if (!ps) return;

			this.waiters.delete(msg.idx);

			if (msg.err != null) {
				ps.reject(msg.err);
			} else {
				ps.resolve(msg.data);
			}
		});
	}

	private get nidx(): bigint {
		this.idx++;
		return this.idx;
	}

	exec(msg: Input): Promise<Output> {
		return new Promise<Output>((res, rej) => {
			const idx = this.nidx;
			this.worker.postMessage({ idx: idx, data: msg } as Msg<Input>);
			this.waiters.set(idx, { reject: rej, resolve: res });
		});
	}
}

export function Work<Input, Output>(
	fn: (i: Input) => Promise<Output> | Output,
) {
	parentPort!.on("message", async (msg: Msg<Input>) => {
		try {
			const obj = await fn(msg.data);
			parentPort!.postMessage({ idx: msg.idx, data: obj } as Msg<Output>);
		} catch (e) {
			parentPort!.postMessage({ idx: msg.idx, err: e } as Msg<Output>);
		}
	});
}
