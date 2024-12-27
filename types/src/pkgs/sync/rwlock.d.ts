/// <reference types="node" resolution-mode="require"/>
import { inspect } from "node:util";
declare class ReleaseHandle implements AsyncDisposable {
    #private;
    constructor(v: () => Promise<void>);
    [Symbol.asyncDispose](): PromiseLike<void>;
}
export declare class RwLock {
    private readonly lock;
    private writing;
    private readings;
    private readonly waiters;
    constructor();
    [inspect.custom](): string;
    private releasew;
    private releaser;
    acquirew(): Promise<ReleaseHandle>;
    acquirer(): Promise<ReleaseHandle>;
}
export {};
