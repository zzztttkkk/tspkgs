/// <reference types="node" resolution-mode="require"/>
import { inspect } from "util";
export declare class Lock implements Disposable {
    private locked;
    private readonly waiters;
    constructor();
    acquire(): Promise<this>;
    release(): void;
    [Symbol.dispose](): void;
    [inspect.custom](): string;
}
