import fs from "fs/promises";
import { RegisterOnShutdown } from "../internal/index.js";

export interface Appender {
	append(log: string): void;
}

export class FileAppender implements Appender {
	buffers: string[] = [];
	size: number = 0;
	fd: fs.FileHandle | null = null;

	tmp: string[] = [];
	interval: NodeJS.Timeout | null = null;

	constructor(
		private path: string,
		private bufsize: number,
	) {
		this.interval = setInterval(this.task, 100);
		RegisterOnShutdown(
			`pkgs.logging.CloseFileAppender: ${this.path}`,
			this.close,
		);
	}

	private async write(txt: string) {
		if (this.fd == null) {
			this.fd = await fs.open(this.path, "a");
		}
		await fs.writeFile(this.fd, txt);
	}

	private async close() {
		if (this.fd == null) {
			return;
		}
		if (this.interval) {
			clearInterval(this.interval);
		}
		await this.task();
	}

	private async task() {
		const txt = this.tmp.join("");
		this.tmp.length = 0;
		await this.write(txt);
	}

	append(log: string): void {
		this.buffers.push(log);
		this.size += log.length;
		if (this.size < this.bufsize) {
			return;
		}
		this.tmp.push(this.buffers.join(""));
		this.buffers.length = 0;
		this.size = 0;
	}
}
