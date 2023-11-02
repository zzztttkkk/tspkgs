import { Worker, parentPort, threadId } from "worker_threads";

interface Msg<T> {
	idx: bigint;
	data: T;
	err?: Error;
	canceled?: boolean;
	timeouted?: boolean;
}

interface Waiter<T> {
	resolve: (v: T) => void;
	reject: (e: Error) => void;
}

interface ExecOptions {
	Timeout?: number;
	GetIdx?: (idx: bigint) => void;
}

export const Errors = {
	Timeouted: new Error("Timeouted"),
	Canceled: new Error("Canceled"),
};

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

	exec(msg: Input, opts?: ExecOptions): Promise<Output> {
		return new Promise<Output>((res, rej) => {
			const idx = this.nidx;
			this.worker.postMessage({ idx: idx, data: msg } as Msg<Input>);
			this.waiters.set(idx, { reject: rej, resolve: res });

			if (opts) {
				if (opts.GetIdx) {
					opts.GetIdx(idx);
				}
				if (opts.Timeout && opts.Timeout > 0) {
					setTimeout(() => {
						this.worker.postMessage({
							idx: idx,
							timeouted: true,
						} as Msg<Input>);
						this.waiters.delete(idx);
						rej(Errors.Timeouted);
					}, opts.Timeout);
				}
			}
		});
	}

	cancel(idx: bigint) {
		const fns = this.waiters.get(idx);
		if (!fns) return;
		this.worker.postMessage({
			idx: idx,
			canceled: true,
		} as Msg<Input>);
		fns.reject(Errors.Canceled);
		this.waiters.delete(idx);
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

	private blanceExec(msg: Input, opts?: ExecOptions): Promise<Output> {
		this.workers = this.workers.sort((a, b) => a.busycount - b.busycount);
		return this.workers[0].exec(msg, opts);
	}

	exec(msg: Input, opts?: ExecOptions): Promise<Output> {
		const idx = Math.floor(Math.random() * this.workers.length);
		return this.workers[idx].exec(msg, opts);
	}
}

export interface Hooks {
	Canceled: Promise<void>;
	Timeouted: Promise<void>;
}

const threads = new Map<number, number>();

export function Work<Input, Output>(
	fn: (i: Input) => Promise<Output> | Output,
) {
	if (threads.has(threadId)) {
		throw new Error(`Thread${threadId} is working`);
	}
	threads.set(threadId, 1);

	parentPort!.on("message", async (msg: Msg<Input>) => {
		try {
			const obj = await fn(msg.data);
			parentPort!.postMessage({ idx: msg.idx, data: obj } as Msg<Output>);
		} catch (e) {
			parentPort!.postMessage({ idx: msg.idx, err: e } as Msg<Output>);
		}
	});
}

export function WorkWithHooks<Input, Output>(
	fn: (i: Input, hooks: Hooks) => Promise<Output> | Output,
) {
	if (threads.has(threadId)) {
		throw new Error(`Thread${threadId} is working`);
	}
	threads.set(threadId, 1);

	const hooks = new Map<
		bigint,
		{ OnTimeout: () => void; OnCanceled: () => void }
	>();

	parentPort!.on("message", async (msg: Msg<Input>) => {
		const idx = msg.idx;

		if (msg.timeouted) {
			const hs = hooks.get(idx);
			if (hs) hs.OnTimeout();
			return;
		}

		if (msg.canceled) {
			const hs = hooks.get(idx);
			if (hs) hs.OnCanceled();
			return;
		}

		const hs = {} as any;
		const ps = {
			Timeouted: new Promise<void>((res) => {
				hs.OnTimeout = res;
			}),
			Canceled: new Promise<void>((res) => {
				hs.OnCanceled = res;
			}),
		};
		hooks.set(idx, hs);

		try {
			const obj = await fn(msg.data, ps);
			parentPort!.postMessage({ idx, data: obj } as Msg<Output>);
		} catch (e) {
			parentPort!.postMessage({ idx, err: e } as Msg<Output>);
		} finally {
			hooks.delete(idx);
			try {
				hs.OnTimeout();
				hs.OnCanceled();
			} catch {}
		}
	});
}
