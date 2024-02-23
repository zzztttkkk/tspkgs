import { Level } from "./item.js";

export class Logger {
	#level: Level;

	constructor(level: Level) {
		this.#level = level;
	}
}
