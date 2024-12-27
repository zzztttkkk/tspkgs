import type { Appender } from "./appender.js";
import { type Item } from "./item.js";
import type { Renderer } from "./renderer.js";
export declare abstract class AbsDispatcher {
    protected abstract dispatch(item: Item): {
        renderer: Renderer;
        appender: Appender;
    } | null | undefined;
    private log;
    trace(msg: string, ...args: any[]): Promise<void>;
    debug(msg: string, ...args: any[]): Promise<void>;
    info(msg: string, ...args: any[]): Promise<void>;
    warn(msg: string, ...args: any[]): Promise<void>;
    error(msg: string, ...args: any[]): Promise<void>;
}
export declare function With<R>(meta: {
    [k: string]: any;
}, fn: () => R): R;
