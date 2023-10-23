import { Worker, parentPort } from "worker_threads";

interface Msg<T> {
	idx: bigint;
	data: T;
	err?: Error;
}

interface Waiter<T> {
	resolve: (v: T) => void;
	reject: (e: Error) => void;
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

	get busycount(): number {
		return this.waiters.size;
	}

	get idle(): boolean {
		return this.waiters.size < 1;
	}
}

export enum TypedWorkerPoolDispatchPolicy {
	Random,
	Blance,
}

export class TypedWorkerPool<Input, Output> {
	private workers: TypedWorker<Input, Output>[];

	constructor(
		size: number,
		file: string,
		policy?: TypedWorkerPoolDispatchPolicy,
	) {
		this.workers = [];
		for (let i = 0; i < size; i++) {
			this.workers.push(new TypedWorker<Input, Output>(file));
		}
		if (this.workers.length < 1) {
			throw new Error(`bad size`);
		}
		policy = policy || TypedWorkerPoolDispatchPolicy.Random;
		switch (policy) {
			case TypedWorkerPoolDispatchPolicy.Blance: {
				this.exec = this.blanceExec.bind(this);
				break;
			}
		}
	}

	private blanceExec(msg: Input): Promise<Output> {
		this.workers = this.workers.sort((a, b) => a.busycount - b.busycount);
		return this.workers[0].exec(msg);
	}

	exec(msg: Input): Promise<Output> {
		const idx = Math.floor(Math.random() * this.workers.length);
		return this.workers[idx].exec(msg);
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
