import { ismain } from "../internal/index.js";

type RealDateT = Date;

const RealDate = global.Date;
const g = { diff: 0 };

export class FakeDate {
	private raw: RealDateT;

	constructor(...args: any) {
		if (args.length) {
			// @ts-ignore
			const real = new RealDate(...args);
			this.raw = real;
		} else {
			this.raw = new RealDate(RealDate.now() + g.diff);
		}
	}

	[Symbol.toPrimitive](tag: string) {
		return this.raw[Symbol.toPrimitive](tag);
	}

	static now(): number {
		return RealDate.now() + g.diff;
	}

	static parse(v: string) {
		return RealDate.parse(v);
	}

	static UTC(...args: any) {
		// @ts-ignore
		return RealDate.UTC(...args);
	}

	static async hook(v: string) {
		const now = RealDate.now();
		const fnow = new RealDate(v).getTime();
		g.diff = fnow - now;
		// @ts-ignore
		global.Date = FakeDate;

		try {
			await import("luxon");
			hookForLuxon();
		} catch {}
	}
}

// - open: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/
// - exec: Array.from(document.querySelectorAll("div.sidebar-body ol li code")).map(v => v.innerText).filter(v => v.endsWith('()'));
const AllMethods = [
	"Date.prototype[@@toPrimitive]()",
	"Date.prototype.getDate()",
	"Date.prototype.getDay()",
	"Date.prototype.getFullYear()",
	"Date.prototype.getHours()",
	"Date.prototype.getMilliseconds()",
	"Date.prototype.getMinutes()",
	"Date.prototype.getMonth()",
	"Date.prototype.getSeconds()",
	"Date.prototype.getTime()",
	"Date.prototype.getTimezoneOffset()",
	"Date.prototype.getUTCDate()",
	"Date.prototype.getUTCDay()",
	"Date.prototype.getUTCFullYear()",
	"Date.prototype.getUTCHours()",
	"Date.prototype.getUTCMilliseconds()",
	"Date.prototype.getUTCMinutes()",
	"Date.prototype.getUTCMonth()",
	"Date.prototype.getUTCSeconds()",
	"Date.prototype.getYear()",
	"Date.now()",
	"Date.parse()",
	"Date.prototype.setDate()",
	"Date.prototype.setFullYear()",
	"Date.prototype.setHours()",
	"Date.prototype.setMilliseconds()",
	"Date.prototype.setMinutes()",
	"Date.prototype.setMonth()",
	"Date.prototype.setSeconds()",
	"Date.prototype.setTime()",
	"Date.prototype.setUTCDate()",
	"Date.prototype.setUTCFullYear()",
	"Date.prototype.setUTCHours()",
	"Date.prototype.setUTCMilliseconds()",
	"Date.prototype.setUTCMinutes()",
	"Date.prototype.setUTCMonth()",
	"Date.prototype.setUTCSeconds()",
	"Date.prototype.setYear()",
	"Date.prototype.toDateString()",
	"Date.prototype.toISOString()",
	"Date.prototype.toJSON()",
	"Date.prototype.toLocaleDateString()",
	"Date.prototype.toLocaleString()",
	"Date.prototype.toLocaleTimeString()",
	"Date.prototype.toString()",
	"Date.prototype.toTimeString()",
	"Date.prototype.toUTCString()",
	"Date.UTC()",
	"Date.prototype.valueOf()",
];

AllMethods.filter((v) => v.includes("prototype") && !v.includes("["))
	.map((v) => v.split("."))
	.map((v) => v[v.length - 1])
	.map((v) => v.slice(0, v.length - 2))
	.forEach((v) => {
		// @ts-ignore
		FakeDate.prototype[v] = function (...args: any[]): any {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return this.raw[v](...args);
		};
	});

function hookForLuxon() {
	// eslint-disable-next-line @typescript-eslint/unbound-method
	const RawToString = Object.prototype.toString.bind(Object.prototype);
	// eslint-disable-next-line no-extend-native
	Object.prototype.toString = function () {
		if (this instanceof FakeDate) {
			return `[object Date]`;
		}
		return RawToString.call(this);
	};
}

if (ismain(import.meta)) {
	await FakeDate.hook("2725-12-12 12:45:56");
	console.log(new Date().getFullYear() === 2725);
}
