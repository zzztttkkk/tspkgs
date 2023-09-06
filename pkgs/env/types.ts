import type { PropOptions } from "./mod.ts";

export abstract class BaseEnvValue {
	protected readonly v: string;
	protected readonly opts: PropOptions;
	constructor(v: string, opts: PropOptions) {
		this.v = v;
		this.opts = opts;
	}

	protected abstract init(): Promise<void>;

	static async init<T extends BaseEnvValue>(
		cls: { new (v: string, opts: PropOptions): T },
		v: string,
		opts: PropOptions,
	): Promise<T> {
		const val = new cls(v, opts);
		await val.init();
		return val;
	}
}

export class FilePath extends BaseEnvValue {
	protected async init() {
	}

	async content() {
	}
}
