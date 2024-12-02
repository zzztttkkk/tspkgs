import { AsyncLocalStorage } from "node:async_hooks";
import type { Appender } from "./appender.js";
import { type Item, Level } from "./item.js";
import type { Renderer } from "./renderer.js";

const AllMetaStores = [] as AsyncLocalStorage<{ [k: string]: any }>[];

function MergeMetas(): { [k: string]: any } {
	const meta = {};
	for (const store of AllMetaStores) {
		const v = store.getStore();
		if (v) {
			Object.assign(meta, v);
		}
	}
	return meta;
}

export abstract class AbsDispatcher {
	protected abstract dispatch(
		item: Item,
	): { renderer: Renderer; appender: Appender } | null | undefined;

	private async log(level: Level, msg: string, ...args: any[]) {
		const item: Item = {
			at: Date.now(),
			level,
			msg,
			args,
		};
		if (AllMetaStores.length > 0) {
			item.meta = MergeMetas();
		}

		const ra = this.dispatch(item);
		if (!ra) return;

		await ra.appender.append(item.at, ra.renderer.render(item));
	}

	async trace(msg: string, ...args: any[]) {
		return this.log(Level.Trace, msg, ...args);
	}

	async debug(msg: string, ...args: any[]) {
		return this.log(Level.Debug, msg, ...args);
	}

	async info(msg: string, ...args: any[]) {
		return this.log(Level.Info, msg, ...args);
	}

	async warn(msg: string, ...args: any[]) {
		return this.log(Level.Warn, msg, ...args);
	}

	async error(msg: string, ...args: any[]) {
		return this.log(Level.Error, msg, ...args);
	}
}

export function With<R>(meta: { [k: string]: any }, fn: () => R): R {
	const store = new AsyncLocalStorage<{ [k: string]: any }>();
	AllMetaStores.push(store);
	return store.run(meta, fn);
}
