import * as JSONC from "std/jsonc/mod.ts";

if (!import.meta.main) {
	console.log("please run this script as main");
	Deno.exit(0);
}

const config = JSONC.parse(await Deno.readTextFile("./deno.jsonc")) as any;
const imports = config.imports as Record<string, string> | undefined;

for (const [alias, url] of Object.entries(imports || {})) {
	const idx = url.indexOf("@");
	if (idx < 0) continue;
	const resp = await fetch(url.slice(0, idx), { redirect: "manual" });
	if (resp.status !== 302 || !resp.headers.get("location")) {
		console.log(`unexpected status code for: ${alias}`);
		continue;
	}

	const latest_url = resp.headers.get("location");
	const remote_version = latest_url!.slice(latest_url!.indexOf("@") + 1) + "/";
	const local_version = url.slice(idx + 1);

	if (remote_version !== local_version) {
		console.log(`${alias}: local: ${local_version}, remote: ${remote_version}`);
	}
}
