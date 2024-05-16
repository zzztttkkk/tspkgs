export enum Level {
	Trace = -1,
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
}

export interface Item {
	at: number;
	level: Level;
	msg: string;
	args: any[];
}
