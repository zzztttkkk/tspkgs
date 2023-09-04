import * as fs from "fs";
import type {PropOptions} from "./props.js";

export class FilePath {
    private readonly fp: string;
    private data: Buffer | null = null;

    constructor(fp: string, opts: PropOptions) {
        this.fp = fp;
        if (!opts.fsAllowNotExists) {
            const status = fs.statSync(this.fp);
            if (!status.isFile()) {
                throw new Error(`"${fp}" is not a file`);
            }
        }
    }

    toString(): string {
        return this.fp;
    }

    async content(): Promise<Buffer> {
        if (this.data != null) return this.data;
        return new Promise<Buffer>((res, rej) => {
            fs.readFile(this.fp, (e, d) => {
                if (e) {
                    rej(e);
                    return;
                }
                this.data = d;
                res(this.data);
            });
        });
    }
}

export class DirPath {
    private fp: string;

    constructor(fp: string, opts: PropOptions) {
        this.fp = fp;
        if (!opts.fsAllowNotExists) {
            const status = fs.statSync(this.fp);
            if (!status.isDirectory()) {
                throw new Error(`"${fp}" is not a directory`);
            }
        }
    }

    toString(): string {
        return this.fp;
    }

    async list(): Promise<fs.Dirent[]> {
        return new Promise<fs.Dirent[]>((res, rej) => {
            fs.readdir(this.fp, {withFileTypes: true}, (e, fl) => {
                if (e) {
                    rej(e);
                    return;
                }
                res(fl);
            });
        });
    }
}

const endswithEmptyReturn: [boolean, string | null] = [false, null];

function endswith(v: string, units: string[]): [boolean, string | null] {
    for (const unit of units) {
        if (v.endsWith(unit)) {
            return [true, v.slice(0, v.length - unit.length)];
        }
    }
    return endswithEmptyReturn;
}

const durationRules: { units: string[]; factor: number }[] = [
    {units: ["ms"], factor: 1},
    {units: ["s", "sec"], factor: 1000},
    {units: ["m", "min"], factor: 60_000},
    {units: ["h", "hour"], factor: 60 * 60_000},
    {units: ["d", "day"], factor: 24 * 60 * 60_000},
    {units: ["w", "week"], factor: 7 * 24 * 60 * 60_000},
];

export class Duration {
    private mills?: number;

    constructor(tv: string, opts: PropOptions) {
        tv = tv.toLowerCase();

        for (const rule of durationRules) {
            const [ok, uv] = endswith(tv, rule.units);
            if (!ok) continue;
            this.mills = Number.parseInt(uv!) * rule.factor;
        }

        if (this.mills == null || Number.isNaN(this.mills)) {
            throw new Error(`bad duration value in env, ${tv}`);
        }

        if (
            (opts.min != null && this.mills < opts.min) ||
            (opts.max != null && this.mills > opts.max)
        ) {
            throw new Error(`duration value out of range, ${tv}`);
        }
    }

    toString(): string {
        return `${this.mills!}ms`;
    }

    get ms(): number {
        return this.mills!;
    }

    get seconds(): number {
        return this.ms / 1000;
    }
}
