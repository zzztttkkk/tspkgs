import {Lock} from "./lock.js";
import {Stack} from "../internal/index.js";


interface Waiter {
    w: boolean;
    resolve: () => void;
}

type ReleaseHandler = () => Promise<void>;

export class RwLock {
    private lock: Lock;
    private writing = false;
    private readings = 0;
    private waiters: Stack<Waiter>;

    constructor() {
        this.lock = new Lock;
        this.waiters = new Stack;
    }

    private async release_write() {
        await this.lock.acquire();
        try {
            if (this.waiters.empty()) {
                this.writing = false;
                return;
            }

            const top = this.waiters.pop();
            if (top.w) {
                top.resolve();
                return;
            }

            this.readings++;
            top.resolve;
        } finally {
            this.lock.release();
        }
    }

    private async release_read() {
        await this.lock.acquire();
        try {
            if (this.waiters.empty()) {
                this.readings--;
                return;
            }
            if (this.waiters.peek().w) return;
            this.waiters.pop().resolve();
        } finally {
            this.lock.release();
        }
    }

    async acquirew(): Promise<ReleaseHandler> {
        await this.lock.acquire();
        if (this.writing || this.readings) {
            await new Promise<void>((resolve) => {
                this.waiters.push({resolve, w: true});
                this.lock.release();
            });
            return this.release_write.bind(this);
        }
        this.writing = true;
        this.lock.release();
        return this.release_write.bind(this);
    }

    async acquirer(): Promise<ReleaseHandler> {
        await this.lock.acquire();
        if (this.writing) {
            await new Promise<void>((resolve) => {
                this.waiters.push({resolve, w: false});
                this.lock.release();
            });
            return this.release_read.bind(this);
        }
        this.readings++;
        this.lock.release();
        return this.release_read.bind(this);
    }

    private async within<T, Args>(w: boolean, fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T> {
        let handler: ReleaseHandler | undefined;
        try {
            if (w) {
                handler = await this.acquirew();
            } else {
                handler = await this.acquirer();
            }
            return (await fn(args));
        } finally {
            if (handler) {
                await handler();
            }
        }
    }

    async withinw<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T> {
        return this.within(true, fn, args);
    }

    async withinr<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T> {
        return this.within(false, fn, args);
    }
}
