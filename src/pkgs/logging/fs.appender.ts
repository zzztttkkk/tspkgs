import fs from "fs";
import path from "path";
import { Appender } from "./appender.js";
import { FileHandle } from "fs/promises";
import { DateTime } from "luxon";

export type RotationKind = "daily" | "hourly" | "minutely";

export class AsyncFileAppender implements Appender {
	private fp: string;

	private dir: string;
	private filename: string;
	private ext: string;

	private bufsize: number;
	private rotation: RotationKind | undefined;
	private rotationbeginat: number = 0;
	private rotationendat: number = 0;

	private fd: FileHandle | null = null;
	private buf: string[] = [];
	private currentbufsize: number = 0;
	private closed = false;

	constructor(
		fp: string,
		opts?: {
			rotation?: RotationKind;
			bufsize?: number;
		},
	) {
		this.fp = fp;
		this.bufsize = opts?.bufsize || 1024 * 8;
		if (Number.isSafeInteger(this.bufsize)) {
			this.bufsize = 1024 * 8;
		}

		this.rotation = opts?.rotation;
		this.rotationbeginat = Date.now();
		this.rotationendat = AsyncFileAppender.endat(
			this.rotationbeginat,
			opts?.rotation || "daily",
		);

		this.dir = path.dirname(fp);
		this.ext = path.extname(fp);
		this.filename = path.basename(fp, this.ext);
	}

	private static endat(v: number, rotation: RotationKind) {
		const dt = DateTime.fromMillis(v);
		switch (rotation) {
			case "daily": {
				return dt.endOf("day").toMillis();
			}
			case "hourly": {
				return dt.endOf("hour").toMillis();
			}
			case "minutely": {
				return dt.endOf("minute").toMillis();
			}
		}
	}

	private async rotate(at: number) {
		if (!this.rotation == null) return;
		if (at <= this.rotationendat) return;

		await this.flush();

		if (this.fd != null) {
			await this.fd.close();
		}
		this.fd = null;

		let dv: string = "";
		switch (this.rotation) {
			case "daily": {
				dv = DateTime.fromMillis(this.rotationbeginat).toFormat("yyyyMMdd");
			}
			case "hourly": {
				dv = DateTime.fromMillis(this.rotationbeginat).toFormat("yyyyMMddHH");
			}
			case "minutely": {
				dv = DateTime.fromMillis(this.rotationbeginat).toFormat("yyyyMMddHHmm");
			}
		}

		const filename = `${this.dir}/${this.filename}.${dv}.${this.ext}`;
		await fs.promises.rename(this.fp, filename);
	}

	private async flush() {
		if (this.buf.length == 0) return;
		if (this.fd == null) {
			this.fd = await fs.promises.open(this.fp, "a+");
		}
		await fs.promises.appendFile(this.fd, this.buf.join(""));
		this.buf.length = 0;
		this.currentbufsize = 0;
	}

	async append(at: number, log: string) {
		if (this.closed) {
			throw new Error(`tspkgs.logging.fs.appender: closed`);
		}

		await this.rotate(at);

		this.buf.push(log);
		this.buf.push("\r\n");
		this.currentbufsize += log.length;
		if (this.currentbufsize >= this.bufsize) {
			await this.flush();
		}
	}

	async close() {
		this.closed = true;
		await this.rotate(Date.now());
		await this.flush();
		if (this.fd) {
			await this.fd.close();
		}
	}
}
