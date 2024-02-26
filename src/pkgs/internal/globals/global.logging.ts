import "./global.process.js";

import pino from "pino";
import SonicBoom from "sonic-boom";
import path from "path";
import fs from "fs/promises";
import { exists } from "../../io/index.js";
import { sleep } from "../index.js";

interface LogFn {
	<T extends object>(obj: T, msg?: string, ...args: any[]): void;
	(obj: unknown, msg?: string, ...args: any[]): void;
	(msg: string, ...args: any[]): void;
}

declare global {
	namespace logging {
		const init: {
			(opts: pino.LoggerOptions, stream?: pino.DestinationStream): void;
		};

		const flush: () => Promise<void>;

		const trace: LogFn;
		const debug: LogFn;
		const info: LogFn;
		const warn: LogFn;
		const error: LogFn;
		const fatal: LogFn;
		const child: (
			bindings: pino.Bindings,
			options?: pino.ChildLoggerOptions,
		) => pino.Logger;

		interface DailyRotationSonicBoomOption extends SonicBoom.SonicBoomOpts {
			datefmt?: (year: number, month: number, date: number) => string;
		}

		const dailyrotation: (
			opts: DailyRotationSonicBoomOption,
		) => SonicBoom.SonicBoom;
	}
}

let _logger: pino.Logger | null = null;

function dailyrotation(
	opts: logging.DailyRotationSonicBoomOption,
): SonicBoom.SonicBoom {
	opts.mkdir = true;

	let fp = opts.dest;
	if (!fp || typeof fp !== "string") {
		throw new Error(`empty file path or not a string`);
	}
	fp = path.resolve(fp);

	const dest = fp;
	let flag: boolean = false;
	let tmp: string[] = [];
	const datefmt: (year: number, month: number, date: number) => string =
		opts.datefmt
			? opts.datefmt
			: (y, m, d) => `${y}_${m < 10 ? `0${m}` : m}_${d < 10 ? `0${d}` : d}`;

	const filepath = path.dirname(fp);
	const basename = path.basename(fp);
	const fileext = path.extname(basename);
	const filename = basename.slice(0, basename.length - fileext.length);
	let timeoutHandle: NodeJS.Timeout | undefined;

	const obj = new SonicBoom.SonicBoom(opts);

	function go() {
		const now = Date.now();
		const date = new Date(now - 3600_000);
		date.setHours(23, 59, 59, 999);
		const endofday = date.getTime();
		timeoutHandle = setTimeout(rotation, endofday - now);
	}

	async function rename() {
		const now = new Date();
		const [year, month, date] = [
			now.getFullYear(),
			now.getMonth() + 1,
			now.getDate(),
		];

		const namewithoutext = `${filepath}/${filename}.${datefmt(
			year,
			month,
			date,
		)}`;

		let idx = 0;
		while (true) {
			let name: string;
			if (idx === 0) {
				name = `${namewithoutext}${fileext}`;
			} else {
				if (idx <= 5) {
					name = `${namewithoutext}.${idx}${fileext}`;
				} else {
					name = `${namewithoutext}.${idx}.${Date.now()}${fileext}`;
				}
			}

			if (await exists(name)) {
				idx++;
				continue;
			}

			await fs.rename(dest, name);
			break;
		}

		obj.reopen();
	}

	async function rotation() {
		flag = true;

		await new Promise<void>((res) => obj.flush(() => res()));

		await rename();

		for (const item of tmp) {
			obj.write(item);
		}

		tmp = [];
		flag = false;
		go();
	}

	const write = obj.write.bind(obj);

	obj.write = function (v: string): boolean {
		if (flag) {
			tmp.push(v);
			return true;
		}
		return write(v);
	};

	const end = obj.end.bind(obj);

	async function wait() {
		while (flag) {
			await sleep(50);
		}
	}

	obj.end = function () {
		clearTimeout(timeoutHandle);
		if (!flag) {
			end();
			return;
		}
		wait().then(() => end());
	};

	go();
	return obj;
}

const __logging = {
	init: function (opts: pino.LoggerOptions, stream?: pino.DestinationStream) {
		_logger = pino.pino(opts, stream);

		for (const name of [
			"trace",
			"info",
			"debug",
			"warn",
			"error",
			"fatal",
			"child",
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
	dailyrotation,
};

Object.defineProperty(global, "logging", {
	value: __logging,
	writable: false,
	configurable: false,
	enumerable: true,
});
