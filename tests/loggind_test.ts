import { sleep } from "../src/index.js";
import { Appender, FuncAppender } from "../src/pkgs/logging/appender.js";
import { Item } from "../src/pkgs/logging/item.js";
import { AbsDispatcher, With } from "../src/pkgs/logging/logger.js";
import { JSONRenderer, Renderer } from "../src/pkgs/logging/renderer.js";
import { append, close } from "./worker.log.appender.js";

process.RegisterOnShutdownAction(async () => {
	await close();
});

class Dispatcher extends AbsDispatcher {
	private renderer = new JSONRenderer("yyyy-MM-dd HH:mm:ss.SSS Z");
	private appender = new FuncAppender(append, close);

	protected dispatch(
		item: Item,
	): { renderer: Renderer; appender: Appender } | null | undefined {
		return {
			renderer: this.renderer,
			appender: this.appender,
		};
	}
}

const dispatcher = new Dispatcher();

await With({ xxx: 34, yyy: 45 }, async () => {
	let i = 0;
	while (true) {
		await sleep(500);
		await dispatcher.debug("xxx", i);
		i++;
	}
});
