import { DateTime } from "luxon";
import type { Item } from "./item.js";

export interface Renderer {
	render(item: Item): string;
}

const LevelStrings = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"];

export class SimpleLineRenderer implements Renderer {
	private _render_fn: (item: Item) => string;

	constructor(timelayout?: string) {
		if (timelayout) {
			this._render_fn = (item: Item) => {
				let meta = "";
				if (item.meta) {
					const metabuf = [] as string[];
					for (const [k, v] of Object.entries(item.meta)) {
						metabuf.push(`${k}=${JSON.stringify(v)}`);
					}
					meta = `[${metabuf.join("; ")}]`;
				}
				const times = DateTime.fromMillis(item.at).toFormat(timelayout);
				return `[${LevelStrings[item.level]}] [${times}] ${meta} Message: ${item.msg
					}; Args: ${item.args}`;
			};
		} else {
			this._render_fn = (item: Item) => {
				let meta = "";
				if (item.meta) {
					const metabuf = [] as string[];
					for (const [k, v] of Object.entries(item.meta)) {
						metabuf.push(`${k}=${JSON.stringify(v)}`)
					}
					meta = `[${metabuf.join("; ")}]`;
				}
				return `[${LevelStrings[item.level]}] [${item.at}] ${meta} Message: ${item.msg
					}; Args: ${item.args}`;
			};
		}
	}

	render(item: Item): string {
		return this._render_fn(item);
	}
}

export class JSONRenderer implements Renderer {
	private _render_fn: (item: Item) => string;

	constructor(opts?: { timelayout?: string; rawlevel?: boolean }) {
		if (opts?.timelayout) {
			this._render_fn = (item: Item) => {
				return JSON.stringify({
					...item,
					at: DateTime.fromMillis(item.at).toFormat(opts!.timelayout!),
				});
			};
		} else {
			this._render_fn = (item: Item) => {
				return JSON.stringify(item);
			};
		}

		if (!opts?.rawlevel) {
			const fn = this._render_fn;
			this._render_fn = (item: Item) => {
				const ele = { ...item, level: LevelStrings[item.level] };
				return fn(ele as any);
			};
		}
	}

	render(item: Item): string {
		return this._render_fn(item);
	}
}
