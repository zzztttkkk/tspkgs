import { Buffer, BufReader } from "std/io/mod.ts";

interface ContentOptions {
	prealloc?: boolean;
	istxt?: boolean;
}

const defaultContentOpts: ContentOptions = {};

export async function content(fp: string, opts: { istxt: true } & ContentOptions): Promise<string>;
export async function content(fp: string, opts?: { istxt?: false } & ContentOptions): Promise<Buffer>;
export async function content(fp: string, opts?: ContentOptions): Promise<Buffer | string> {
	opts = opts || defaultContentOpts;
	if (opts.istxt) {
		return await Deno.readTextFile(fp);
	}

	const result = new Buffer();
	if (opts.prealloc) {
		const stat = await Deno.stat(fp);
		result.grow(stat.size);
	}

	const f = await Deno.open(fp);
	const buf = new Uint8Array(4096);
	while (true) {
		const rl = await f.read(buf);
		if (!rl) {
			break;
		}
		result.writeSync(buf.slice(0, rl));
	}
	return result;
}

export interface LinesOptions {
	maxsize?: number;
}

const defaultLinesOpts: LinesOptions = {};

export async function* lines(fp: string, opts: LinesOptions = defaultLinesOpts): AsyncGenerator<Uint8Array> {
	const reader = new BufReader(await Deno.open(fp));
	const buffer = new Buffer();
	let done = false;

	while (true) {
		if (done) break;
		const result = await reader.readLine();
		if (result == null) {
			if (buffer.length > 0) {
				done = true;
				yield buffer.bytes();
				continue;
			}
			break;
		}

		if (result.more) {
			buffer.writeSync(result.line);
			if (opts.maxsize && opts.maxsize > 0 && buffer.length > opts.maxsize) {
				throw new Error(`line size reached the max value ${opts.maxsize}`);
			}
			continue;
		}

		if (buffer.length > 0) {
			yield buffer.bytes();
			buffer.reset();
			continue;
		}
		yield result.line;
	}
}

if (import.meta.main) {
	// const v = await content("./pkgs/internal/fs.ts", { prealloc: true });
	// console.log(new TextDecoder().decode(v.bytes({ copy: false })));

	for await (const line of lines("./pkgs/internal/fs.ts")) {
		console.log(line.length, line.byteLength);
	}
}
