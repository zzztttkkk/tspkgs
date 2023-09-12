import { Socket, createServer } from "net";
import { Stack } from "../internal/stack.js";
import { ismain } from "../internal/index.js";

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
	keepEndl?: boolean;
}

export const ReadTimeoutError = new Error(`read timeout`);
export const ReachMaxSizeError = new Error(`reach max size`);

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

	private onerr(v: any) {
		this.error = v;
		if (this.reject) this.reject(v);
		if (this.buf_reject) this.buf_reject(v);
	}

	static from(sock: Socket): ReadBuffer;
	static from(src: any): ReadBuffer {
		if (src instanceof Socket) {
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

	readline(opts?: ReadLineOptions): Promise<Buffer> {
		return this.readuntil(10, opts);
	}
}

export async function* channel(rs: any): AsyncGenerator<Buffer> {
	const bufs = [] as Buffer[];
	let resolve: () => void;
	let ps = new Promise<void>((res) => {
		resolve = res;
	});

	rs.on("data", (v: Buffer) => {
		bufs.push(v);
		resolve();
	});

	while (true) {
		await ps;
		yield* bufs as any;
		bufs.length = 0;
		ps = new Promise<void>((res) => {
			resolve = res;
		});
	}
}

if (ismain(import.meta)) {
	const server = createServer(async (sock) => {
		const reader = ReadBuffer.from(sock);
		while (true) {
			try {
				const v = await reader.readline();
				console.log("line: ", v.toString());
			} catch {
				console.log(1212);
				return;
			}
		}
	});
	server.listen(5000);
}
