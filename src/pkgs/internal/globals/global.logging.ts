import "./global.process.js";

import pino from "pino";
import type { SonicBoom, SonicBoomOpts } from "sonic-boom";
import path from "path";
import fs from "fs/promises";
import { exists } from "../../io/index.js";

interface LogFn {
	<T extends object>(obj: T, msg?: string, ...args: any[]): void;
	(obj: unknown, msg?: string, ...args: any[]): void;
	(msg: string, ...args: any[]): void;
}

declare global {
	namespace logging {
		const init: (
			opts: pino.LoggerOptions,
			stream?: pino.DestinationStream,
		) => void;

		const flush: () => Promise<void>;

		const trace: LogFn;
		const debug: LogFn;
		const info: LogFn;
		const warn: LogFn;
		const error: LogFn;
		const fatal: LogFn;

		interface DailyRotationSonicBoomOption extends SonicBoomOpts {
			datefmt?: (year: number, month: number, date: number) => string;
		}

		// @ts-ignore
		class DailyRotationSonicBoom implements pino.DestinationStream {
			constructor(opts: DailyRotationSonicBoomOption);
		}
	}
}

let _logger: pino.Logger | null = null;

class DailyRotationSonicBoom implements pino.DestinationStream {
	#sonicboom: SonicBoom;
	#flag: boolean;
	#tmp: string[];
	#dest: string;
	#filepath: string;
	#filename: string;
	#fileext: string;
	#datefmt: (year: number, month: number, date: number) => string;

	constructor(opts: logging.DailyRotationSonicBoomOption) {
		opts.mkdir = true;

		let fp = opts.dest;
		if (!fp || typeof fp !== "string") {
			throw new Error(`empty file path or not a string`);
		}
		this.#dest = fp;

		this.#datefmt = opts.datefmt
			? opts.datefmt
			: (y, m, d) => `${y}_${m < 10 ? `0${m}` : m}_${d < 10 ? `0${d}` : d}`;

		fp = path.resolve(fp);
		this.#filepath = path.dirname(fp);
		const basename = path.basename(fp);
		this.#fileext = path.extname(basename);
		this.#filename = basename.slice(0, basename.length - this.#fileext.length);

		this.#sonicboom = pino.destination(opts);
		this.#tmp = [];
		this.#flag = false;

		this.go();
	}

	private async rename() {
		const now = new Date();
		const [year, month, date] = [
			now.getFullYear(),
			now.getMonth() + 1,
			now.getDate(),
		];

		const namewithoutext = `${this.#filepath}/${this.#filename}.${this.#datefmt(
			year,
			month,
			date,
		)}`;

		let idx = 0;
		while (true) {
			let name: string;
			if (idx === 0) {
				name = `${namewithoutext}${this.#fileext}`;
			} else {
				if (idx <= 5) {
					name = `${namewithoutext}.${idx}${this.#fileext}`;
				} else {
					name = `${namewithoutext}.${idx}.${Date.now()}${this.#fileext}`;
				}
			}

			if (await exists(name)) {
				idx++;
				continue;
			}

			await fs.rename(this.#dest, name);
			break;
		}

		this.#sonicboom.reopen();
	}

	private async rotation() {
		this.#flag = true;

		await new Promise<void>((res) => this.#sonicboom.flush(() => res()));

		await this.rename();

		for (const item of this.#tmp) {
			this.#sonicboom.write(item);
		}

		this.#tmp = [];
		this.#flag = false;
		this.go();
	}

	private go() {
		const date = new Date();
		const now = date.getTime();
		date.setHours(23, 59, 59, 999);
		const endofday = date.getTime();
		setTimeout(this.rotation, endofday - now);
	}

	write(msg: string): void {
		if (this.#flag) {
			this.#tmp.push(msg);
			return;
		}
		this.#sonicboom.write(msg);
	}

	flush(cb: () => void) {
		this.#sonicboom.flush(cb);
	}

	flushSync() {
		this.#sonicboom.flushSync();
	}
}

const __logging = {
	init: function (opts: pino.LoggerOptions, stream?: pino.DestinationStream) {
		_logger = pino.default(opts, stream);

		for (const name of [
			"trace",
			"info",
			"debug",
			"warn",
			"error",
			"fatal",
		] as (keyof pino.Logger)[]) {
			Object.defineProperty(this, name, {
				value: (_logger as any)[name].bind(_logger),
				writable: false,
				configurable: false,
				enumerable: true,
			});
		}

		Object.defineProperty(this, "flush", {
			value: () => {
				return new Promise<void>((res) => _logger!.flush(() => res()));
			},
			writable: false,
			configurable: false,
		});

		BeforeProcessExit(() => (this as any).flush());
	},

	DailyRotationSonicBoom,
};

Object.defineProperty(global, "logging", {
	value: __logging,
	writable: false,
	configurable: false,
	enumerable: true,
});
