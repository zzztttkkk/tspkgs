/// <reference types="node" resolution-mode="require"/>
import { Stack } from "./stack.js";
import { Hole } from "./hole.js";
import { inspect } from "util";
import * as __ from "./__/index.js";
export { Stack, Hole, __ };
export declare function ismain(meta: ImportMeta): boolean;
export declare function source(meta: ImportMeta): string;
export declare function sourcedir(meta: ImportMeta): string;
export declare function sleep(ms: number): Promise<void>;
export declare function UniqueId(v: object): BigInt;
export declare class TraceObject {
    #private;
    constructor(name: string);
    [inspect.custom](): string;
    static readonly A: TraceObject;
    static readonly B: TraceObject;
    static readonly C: TraceObject;
    static readonly D: TraceObject;
    static readonly E: TraceObject;
    static readonly F: TraceObject;
}
