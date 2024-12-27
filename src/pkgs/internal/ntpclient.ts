// Ref from:
// https://github.com/moonpyk/node-ntp-client/blob/master/lib/ntp-client.js

import * as dgram from "node:dgram";
import { ismain } from "./index.js";

const defaultServer = "pool.ntp.org";
const defaultPort = 123;

function getNetworkTime(opts?: { host?: string; port?: number; signal?: AbortSignal }): Promise<Date> {
	const host = opts?.host || defaultServer;
	const port = opts?.port || defaultPort;

	return new Promise<Date>((resolve, reject) => {
		const cli = dgram.createSocket("udp4");
		if (opts?.signal) {
			opts.signal.addEventListener("abort", () => {
				reject(new Error("aborted"));
				try {
					cli.removeAllListeners();
					cli.close();
				} catch {
				}
			});
		}

		const ntpdata = Buffer.alloc(48, 0);
		ntpdata[0] = 0x1B;

		cli.on("error", (e) => reject(e));
		cli.send(ntpdata, 0, ntpdata.length, port, host, (err) => {
			if (err) {
				reject(err);
				return;
			}

			cli.once("message", (msg) => {
				cli.close();

				const offsetTransmitTime = 40;
				let intpart = 0;
				let fractpart = 0;

				for (let i = 0; i <= 3; i++) {
					intpart = 256 * intpart + msg[offsetTransmitTime + i];
				}
				for (let i = 4; i <= 7; i++) {
					fractpart = 256 * fractpart + msg[offsetTransmitTime + i];
				}
				const milliseconds = (intpart * 1000 + (fractpart * 1000) / 0x100000000);
				resolve(new Date(milliseconds));
			});
		});
	});
}

export async function NtpTime(servers: string[], timeout?: number): Promise<Date> {
	if (servers.length < 1) throw new Error(`empty servers`);
	timeout = timeout || 3000;
	if (timeout < 100) {
		timeout = 100;
	}
	const ctrl = new AbortController();
	const th = setTimeout(() => ctrl.abort(), timeout)
	const first = await Promise.any(servers.map(v => getNetworkTime({ host: v, signal: ctrl.signal })));
	ctrl.abort();
	clearTimeout(th);
	return first;
}

if (ismain(import.meta)) {
	console.log((await NtpTime(["time.windows.com", "time.apple.com"])));
}