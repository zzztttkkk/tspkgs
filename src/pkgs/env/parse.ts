import { lines } from "../io/index.js";
import fs from "fs/promises";

function parse_line(line: string, map: Map<string, string>) {
	if (line.length < 1 || line.startsWith("//")) return;
	const [rk, ...vs] = line.split("=");
	const rv = vs.join("=");
	const k = rk.trim();
	let v = rv.trim();

	if (!k.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/g)) {
		throw new Error(`ztkpkgs.env: bad key, "${k}"`);
	}

	if ((v.startsWith("'") || v.startsWith('"')) && v[0] === v[v.length - 1]) {
		v = v.slice(1, v.length - 1);
	}
	map.set(k, v);
	process.env[k] = v;
}

export async function parse(fp: string): Promise<Map<string, string>> {
	const fd = await fs.open(fp);
	const rs = fd.createReadStream({ encoding: "utf8", autoClose: false });

	try {
		const m = new Map<string, string>();
		for await (const line of lines(rs)) {
			parse_line(line, m);
		}
		return m;
	} finally {
		rs.destroy();
		fd.close();
	}
}
