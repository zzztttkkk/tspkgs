import {Stack} from "../internal/index.js";

type Waiter = () => void;

export class Lock {
    private locked = false;
    private waiters: Stack<Waiter>;

    constructor() {
        this.waiters = new Stack();
    }

    async acquire() {
        if (this.locked) {
            await new Promise<void>((resolve) => {
                this.waiters.push(resolve);
            });
            return;
        }
        this.locked = true;
    }

    release() {
        if (this.waiters.empty()) {
            this.locked = false;
            return
        }
        this.waiters.pop()();
    }

    async within<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T> {
        try {
            await this.acquire();
            return (await fn(args));
        } finally {
            this.release();
        }
    }
}
