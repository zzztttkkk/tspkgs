type TimeKind = "system" | "process";

export class TimeLogger {
	#now: () => bigint;
	#name: string;
	#tmp: bigint;
	#unit: string;
	constructor(name: string, kind: TimeKind = "system") {
		if (kind === "system") {
			this.#now = () => BigInt(Date.now());
			this.#unit = "ms";
		} else {
			this.#now = process.hrtime.bigint.bind(process.hrtime);
			this.#unit = "ns";
		}
		this.#name = name;
		this.#tmp = this.#now();
		console.log(
			`[TimeLogger: ${this.#name}]`,
			"-------------------BEGIN-------------------",
		);
	}

	log(...args: any[]) {
		const now = this.#now();
		const du = now - this.#tmp;
		this.#tmp = now;
		console.log(
			`[TimeLogger: ${this.#name}] ${Number(du)}${this.#unit}`,
			...args,
		);
	}
}
