import * as luxon from "luxon";
import { ismain } from "../internal/index.js";
import * as util from "util";

export function Zone(offset: number): luxon.Zone {
	return luxon.FixedOffsetZone.instance(offset * 60);
}

export class Time {
	public static DEFAULT_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS ZZZ";

	private _utcms: number;

	constructor();
	constructor(d: Date);
	constructor(ms: number);
	constructor(txt: string, format?: string, fmtopts?: luxon.DateTimeOptions);

	constructor(
		obj?: Date | number | string,
		fmt?: string,
		fmtopts?: luxon.DateTimeOptions,
	) {
		if (obj == null) {
			this._utcms = Date.now();
			return;
		}

		if (obj instanceof Date) {
			this._utcms = obj.getTime();
			return;
		}

		switch (typeof obj) {
			case "number": {
				this._utcms = obj;
				break;
			}
			case "string": {
				this._utcms = luxon.DateTime.fromFormat(
					obj,
					fmt || Time.DEFAULT_FORMAT,
					fmtopts,
				).toMillis();
				break;
			}
			default: {
				throw new Error("bad args");
			}
		}
	}

	get utcms(): number {
		return this._utcms;
	}

	// https://moment.github.io/luxon/#/formatting?id=table-of-tokens
	format(opts?: { fmt?: string; zone?: string | luxon.Zone }): string {
		return luxon.DateTime.fromMillis(this._utcms, {
			zone: opts?.zone,
		}).toFormat(opts?.fmt || Time.DEFAULT_FORMAT);
	}

	diff(another: Time): luxon.Duration {
		return luxon.Duration.fromMillis(this._utcms - another._utcms);
	}

	add(duration: luxon.Duration): Time {
		this._utcms += duration.toMillis();
		return this;
	}

	sub(duration: luxon.Duration): Time {
		this._utcms -= duration.toMillis();
		return this;
	}

	toString(): string {
		return this.format();
	}

	[util.inspect.custom](): string {
		return `Time {${this.format()}}`;
	}
}

if (ismain(import.meta)) {
	console.log(new Time().format());
}

(luxon.Duration as any).prototype[util.inspect.custom] = function (): string {
	return `Duration {${(this as luxon.Duration).toHuman()}}`;
};
