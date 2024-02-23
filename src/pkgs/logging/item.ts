import luxon from "luxon";

export enum Level {
	Trace,
	Debug,
	Info,
	Warn,
	Error,
	Fatal,
}

export class Item {
	public readonly level: Level;
	public readonly msg: string;
	public readonly args: any[];
	public readonly time: luxon.DateTime;

	constructor(level: Level, msg: string, ...args: any[]) {
		this.level = level;
		this.msg = msg;
		this.args = args;
		this.time = luxon.DateTime.now();
	}
}
