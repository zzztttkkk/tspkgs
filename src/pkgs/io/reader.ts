import { createConnection, createServer } from "net";
import { Stack } from "../internal/stack.js";
import { ismain, sleep } from "../internal/index.js";

interface BaseReadOptions {
	timeout?: number;
}

export interface ReadOptions extends BaseReadOptions {
	tmp?: Buffer;
}

export interface ReadUntilOptions extends BaseReadOptions {
	allocsize?: number;
	maxsize?: number;
}

export interface ReadLineOptions extends ReadUntilOptions {
	noendl?: boolean;
	endl?: Buffer; // default: `Buffer.from("\r\n")`
}

export const ReadTimeoutError = new Error(`read timeout`);
export const ReachMaxSizeError = new Error(`reach max size`);

const ENDL = Buffer.from("\r\n");

export const Errors = {
	Eof: new Error(`Eof`),
	Closed: new Error(`Closed`),
};

class BufferChain {
	private chain: Buffer[];
	private readonly allocsize: number;
	private current?: Buffer;
	private cursor: number = 0;
	private diff: number = 0;

	constructor(allocSize?: number) {
		this.chain = [];
		this.allocsize = allocSize && allocSize > 512 ? allocSize : 512;
	}

	write(
		buf: Buffer,
		start: number,
		end: number,
		allowKeepRef: boolean = false,
	) {
		if (allowKeepRef) {
			if (
				(start === 0 && end === buf.length) || // full
				(end - start) / this.allocsize >= 2 // big
			) {
				this.chain.push(buf.subarray(start, end));
				this.diff += end - start - this.allocsize;
				return;
			}
		}

		while (true) {
			if (!this.current) {
				this.current = Buffer.alloc(this.allocsize);
				this.cursor = 0;
			}

			const remains = this.allocsize - this.cursor;
			const ws = end - start;
			if (ws <= remains) {
				buf.copy(this.current, this.cursor, start, end);
				this.cursor += ws;
				break;
			}

			buf.copy(this.current, this.cursor, start, start + remains);
			this.chain.push(this.current);
			this.current = undefined;
			start += remains;
		}
	}

	merge(): Buffer {
		if (this.current && this.cursor > 0) {
			this.chain.push(this.current.subarray(0, this.cursor));
		}
		const sum = Buffer.concat(this.chain);
		this.chain = [];
		this.current = undefined;
		return sum;
	}

	get size(): number {
		return this.allocsize * this.chain.length + this.cursor + this.diff;
	}
}

const MAX_BUF_STACK_DEPTH = 3;

export class Reader {
	private src: NodeJS.ReadableStream;

	private bufs: Stack<Buffer>;
	private cursor: number;
	private error?: any;
	private reject?: (e: any) => void;
	private buf_resolve?: () => void;
	private buf_reject?: (e: any) => void;

	constructor(src: NodeJS.ReadableStream) {
		this.src = src;
		this.bufs = new Stack();
		this.cursor = 0;

		this.init();
	}

	private init() {
		this.src.on("data", (buf: Buffer) => {
			this.bufs.push(buf);
			if (this.bufs.depth >= MAX_BUF_STACK_DEPTH) {
				this.src.pause();
			}
			if (this.buf_resolve) this.buf_resolve();
		});
		this.src.on("end", () => this.onerr(Errors.Eof));
		this.src.on("close", () => this.onerr(Errors.Closed));
	}

	private onerr(v?: any) {
		this.error = v;
		if (this.reject) this.reject(v);
		if (this.buf_reject) this.buf_reject(v);
	}

	async ensurebufs(): Promise<Buffer | null> {
		if (!this.bufs.empty()) return this.bufs.peek();

		this.src.resume();

		const bufp = new Promise<void>((bufres, bufrej) => {
			this.buf_resolve = bufres;
			this.buf_reject = bufrej;
		});

		try {
			await bufp;
			return this.bufs.peek();
		} catch (e) {
			if (!this.error) {
				this.error = e;
				if (this.reject) this.reject(e);
			}
			return null;
		}
	}

	settimeout(ms: number | undefined): NodeJS.Timeout | undefined {
		if (!ms || ms < 1) return undefined;
		return setTimeout(() => {
			this.error = ReadTimeoutError;
			if (this.buf_reject) this.buf_reject(ReadTimeoutError);
			this.reject!(ReadTimeoutError);
		}, ms);
	}

	readonce(opts?: BaseReadOptions): Promise<Buffer> {
		return new Promise<Buffer>(async (resolve, reject) => {
			if (this.error) {
				reject(this.error);
				return;
			}
			this.reject = reject;

			const timeout = this.settimeout(opts?.timeout);

			const buf = await this.ensurebufs();
			if (!buf) return;
			this.bufs.pop();

			clearTimeout(timeout);

			const cursor = this.cursor;
			this.cursor = 0;
			resolve(cursor > 0 ? buf.subarray(cursor) : buf);
		});
	}

	readexactly(n: number, opts?: ReadOptions): Promise<Buffer> {
		return new Promise<Buffer>(async (resolve, reject) => {
			if (this.error) {
				reject(this.error);
				return;
			}

			this.reject = reject;
			const timeout = this.settimeout(opts?.timeout);
			const tmp = opts?.tmp || Buffer.alloc(n);
			let cur = 0;
			while (true) {
				if (this.error) {
					reject(this.error);
					return;
				}

				const buf = await this.ensurebufs();
				if (!buf) return;

				const required = n - cur;
				const remains = buf.length - this.cursor;
				if (remains <= required) {
					buf.copy(tmp, cur, this.cursor);
					this.cursor = 0;
					this.bufs.pop();
					cur += remains;
				} else {
					buf.copy(tmp, cur, this.cursor, this.cursor + required);
					this.cursor += required;
					cur += required;
				}

				if (cur === n) {
					break;
				}
			}

			clearTimeout(timeout);
			resolve(tmp);
		});
	}

	readuntil(
		required: string | Buffer,
		opts?: ReadUntilOptions,
	): Promise<Buffer> {
		return new Promise<Buffer>(async (resolve, reject) => {
			if (this.error) {
				reject(this.error);
				return;
			}

			this.reject = reject;
			const timeout = this.settimeout(opts?.timeout);
			const tmps = new BufferChain(opts?.allocsize);

			while (true) {
				if (this.error) {
					reject(this.error);
					return;
				}

				if (opts && opts.maxsize && tmps.size > opts.maxsize) {
					this.error = ReachMaxSizeError;
					this.reject(this.error);
					return;
				}

				const buf = await this.ensurebufs();
				if (!buf) return;

				const idx = buf.indexOf(required, this.cursor);
				if (idx < 0) {
					tmps.write(buf, this.cursor, buf.length, true);
					this.cursor = 0;
					this.bufs.pop();
					continue;
				}

				tmps.write(buf, this.cursor, idx + required.length, true);
				this.cursor = idx + required.length;
				if (this.cursor === buf.length) {
					this.bufs.pop();
					this.cursor = 0;
				}
				break;
			}

			clearTimeout(timeout);
			if (opts && opts.maxsize && tmps.size > opts.maxsize) {
				this.error = ReachMaxSizeError;
				this.reject(this.error);
				return;
			}
			resolve(tmps.merge());
		});
	}

	async readline(opts?: ReadLineOptions): Promise<Buffer> {
		const line = await this.readuntil("\n", opts);
		if (!!!opts?.noendl) return line;

		const endl = opts?.endl || ENDL;
		if (endl.length > line.length) return line;

		const ends = line.subarray(line.length - endl.length, line.length);
		if (ends.equals(endl)) return line.subarray(0, line.length - endl.length);
		return line;
	}
}

if (ismain(import.meta)) {
	const server = createServer({}, async (sock) => {
		const reader = new Reader(sock);
		try {
			const v = await reader.readline({ noendl: true, timeout: 5000 });
			console.log("line: ", v.length);
			const buf = await reader.readonce();
			console.log(buf.length);
		} catch (e) {
			console.log(e);
			process.exit(0);
		}
	});

	const cli = createConnection(5000);
	cli.on("connect", async () => {
		cli.write("a".repeat(10 * 1024 * 1024));
		await sleep(1000);
		cli.write("\n");
		cli.write("a".repeat(10 * 1024 * 1024));
	});
	server.listen(5000);
}
