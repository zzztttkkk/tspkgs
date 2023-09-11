import { Socket, createServer } from "net";
import { Stack } from "../internal/stack.js";
import { ismain } from "../internal/index.js";

export interface ReadOptions {
	timeout?: number;
	tmp?: Buffer;
}

export const ReadTimeoutError = new Error(`read timeout`);

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

	read_until(v: number, opts?: ReadOptions): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			
		});
	}
}

if (ismain(import.meta)) {
	const server = createServer(async (sock) => {
		const reader = ReadBuffer.from(sock);
		while (true) {
			try {
				const v = await reader.read(10);
				console.log(v.toString());
			} catch {
				console.log(1212);
				return;
			}
		}
	});
	server.listen(5000);
}
