/// <reference types="node" resolution-mode="require"/>
import { inspect } from "util";
declare class LockHandle implements Disposable {
    private readonly release;
    constructor(release: () => void);
    [Symbol.dispose](): void;
    [inspect.custom](): string;
}
export declare class Lock {
    private locked;
    private readonly waiters;
    private readonly handle;
    constructor();
    acquire(): Promise<LockHandle>;
    release(): void;
    [inspect.custom](): string;
}
export {};
