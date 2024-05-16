import { Appender } from "./appender.js";
import { Item, Level } from "./item.js";
import { Renderer } from "./renderer.js";

export interface Dispatcher {
	dispatch(item: Item): { renderer: Renderer; appender: Appender };
}

var dispatcher: Dispatcher | null = null;

function log(level: Level, msg: string, ...args: any[]) {
	if (!dispatcher) return;

	const item: Item = {
		at: Date.now(),
		level,
		msg,
		args,
	};
	const { renderer, appender } = dispatcher.dispatch(item);
	appender.append(renderer.render(item));
}
