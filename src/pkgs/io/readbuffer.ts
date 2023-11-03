import { Socket, createConnection, createServer } from "net";
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
	removeEndl?: boolean;
	endl?: Buffer; // default: `Buffer.from("\r\n")`
}

export const ReadTimeoutError = new Error(`read timeout`);
export const ReachMaxSizeError = new Error(`reach max size`);

const ENDL = Buffer.from("\r\n");

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

export interface BinaryReadStream {
	on(event: "close", listener: () => void): this;
	on(event: "data", listener: (chunk: Buffer) => void): this;
	on(event: "error", listener: (err: Error) => void): this;
}
export class ReadBuffer {
	private bufs: Stack<Buffer>;
	private cursor: number;
	private error?: any;
	private reject?: (e: any) => void;
	private buf_resolve?: () => void;
	private buf_reject?: (e: any) => void;

	private constructor() {
		this.bufs = new Stack();
		this.cursor = 0;
	}

	private onerr(v?: any) {
		this.error = v;
		if (this.reject) this.reject(v);
		if (this.buf_reject) this.buf_reject(v);
	}

	static from(src: BinaryReadStream): ReadBuffer {
		if (src instanceof Socket || src instanceof File) {
			const obj = new ReadBuffer();
			src.on("data", (inb) => {
				obj.bufs.push(inb);
				if (obj.buf_resolve) obj.buf_resolve();
			});
			src.on("close", obj.onerr.bind(obj));
			src.on("error", obj.onerr.bind(obj));
			return obj;
		}
		throw new Error();
	}

	read(n: number, opts?: ReadOptions): Promise<Buffer> {
		return new Promise<Buffer>(async (resolve, reject) => {
			if (this.error) {
				reject(this.error);
				return;
			}

			this.reject = reject;
			let timeout: NodeJS.Timeout | undefined;
			let timeouted = false;
			let buf_reject: ((v: any) => void) | undefined;
			if (opts && opts.timeout) {
				timeout = setTimeout(() => {
					reject(ReadTimeoutError);
					if (buf_reject) {
						buf_reject(ReadTimeoutError);
					}
					timeouted = true;
					this.error = ReadTimeoutError;
				}, opts.timeout);
			}

			const tmp = opts?.tmp || Buffer.alloc(n);
			let cur = 0;
			while (true) {
				if (this.error) {
					reject(this.error);
					return;
				}

				if (this.bufs.empty()) {
					const bufp = new Promise<void>((bufres, bufrej) => {
						this.buf_resolve = bufres;
						buf_reject = bufrej;
					}).catch(() => {});
					await bufp;
					if (timeouted) return;
				}

				const buf = this.bufs.peek();

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

			if (timeout) clearTimeout(timeout);
			resolve(tmp);
		});
	}

	readuntil(required: number, opts?: ReadUntilOptions): Promise<Buffer> {
		return new Promise<Buffer>(async (resolve, reject) => {
			if (this.error) {
				reject(this.error);
				return;
			}

			this.reject = reject;
			let timeout: NodeJS.Timeout | undefined;
			let timeouted = false;
			let buf_reject: ((v: any) => void) | undefined;
			if (opts && opts.timeout) {
				timeout = setTimeout(() => {
					reject(ReadTimeoutError);
					if (buf_reject) {
						buf_reject(ReadTimeoutError);
					}
					timeouted = true;
					this.error = ReadTimeoutError;
				}, opts.timeout);
			}

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

				if (this.bufs.empty()) {
					const bufp = new Promise<void>((bufres, bufrej) => {
						this.buf_resolve = bufres;
						buf_reject = bufrej;
					}).catch(() => {});
					await bufp;
					if (timeouted) return;
				}

				const buf = this.bufs.peek();
				const idx = buf.indexOf(required, this.cursor);
				if (idx < 0) {
					tmps.write(buf, this.cursor, buf.length, true);
					this.cursor = 0;
					this.bufs.pop();
					continue;
				}

				tmps.write(buf, this.cursor, idx + 1, true);
				this.cursor = idx + 1;
				if (this.cursor === buf.length) {
					this.bufs.pop();
					this.cursor = 0;
				}
				break;
			}
			if (timeout) clearTimeout(timeout);
			if (opts && opts.maxsize && tmps.size > opts.maxsize) {
				this.error = ReachMaxSizeError;
				this.reject(this.error);
				return;
			}
			resolve(tmps.merge());
		});
	}

	async readline(opts?: ReadLineOptions): Promise<Buffer> {
		const line = await this.readuntil(10, opts);
		if (!!!opts?.removeEndl) return line;

		const endl = opts?.endl || ENDL;
		if (endl.length > line.length) return line;

		const ends = line.subarray(line.length - endl.length, line.length);
		if (ends.equals(endl)) return line.subarray(0, line.length - endl.length);
		return line;
	}
}

if (ismain(import.meta)) {
	const server = createServer(async (sock) => {
		const reader = ReadBuffer.from(sock);
		while (true) {
			try {
				const v = await reader.readline({ removeEndl: true });
				console.log("line: ", v.length);
				process.exit(0);
			} catch (e) {
				console.log(e);
				return;
			}
		}
	});

	const cli = createConnection(5000);
	cli.on("connect", async () => {
		cli.write("a".repeat(10240) + "\r");
		await sleep(3000);
		cli.write("\n");
	});
	server.listen(5000);
}
