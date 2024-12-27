import type { Item } from "./item.js";
export interface Renderer {
    render(item: Item): string;
}
export declare class SimpleLineRenderer implements Renderer {
    private _render_fn;
    constructor(timelayout?: string);
    render(item: Item): string;
}
export declare class JSONRenderer implements Renderer {
    private _render_fn;
    constructor(opts?: {
        timelayout?: string;
        rawlevel?: boolean;
    });
    render(item: Item): string;
}
