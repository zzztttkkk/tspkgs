import { inspect } from "util";
import { TraceObject, ismain, sleep } from "../internal/index.js";
import { Stack } from "../internal/stack.js";

type Waiter = () => void;

class LockHandle implements Disposable {
	private readonly release: () => void;

	constructor(release: () => void) {
		this.release = release;
	}

	[Symbol.dispose](): void {
		this.release();
	}

	[inspect.custom]() {
		return `[LockHandle]`;
	}
}

export class Lock {
	private locked = false;
	private readonly waiters: Stack<Waiter>;
	private readonly handle: LockHandle;

	constructor() {
		this.waiters = new Stack();
		this.handle = new LockHandle(this.release.bind(this));
	}

	async acquire() {
		if (this.locked) {
			await new Promise<void>((resolve) => this.waiters.push(resolve));
			return this.handle;
		}
		this.locked = true;
		return this.handle;
	}

	release() {
		if (this.waiters.empty()) {
			this.locked = false;
			return;
		}
		this.waiters.pop()();
	}

	[inspect.custom]() {
		return `[Lock locked: ${this.locked}, waiters: ${this.waiters.depth}]`;
	}
}

if (ismain(import.meta)) {
	const lock = new Lock();

	async function test_routine(idx: number) {
		using _ = await lock.acquire();

		await sleep(Math.random() * 10);
		console.log(idx, Date.now(), lock);
	}

	const ps = [] as Array<Promise<void>>;

	for (let i = 0; i < 100; i++) {
		ps.push(test_routine(i));
	}

	await Promise.all(ps);

	console.log(lock);
}
