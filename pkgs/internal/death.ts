type HookFunc = () => Promise<void>;

const hooks = [] as HookFunc[];

export function OnExit(fn: HookFunc) {
	hooks.push(fn);
}

async function handler() {
	const ps = [] as Array<Promise<void>>;
	for (const hook of hooks) {
		ps.push(hook());
	}
	for (const result of await Promise.allSettled(ps)) {
		if (result.status === "rejected") {
			console.error(result.reason);
		}
	}
	Deno.exit(0);
}

for (const evt of ["SIGINT", "SIGTERM", "SIGBREAK"] as Deno.Signal[]) {
	if (Deno.build.os === "windows" && !["SIGINT", "SIGBREAK"].includes(evt)) {
		continue;
	}
	Deno.addSignalListener(evt, handler);
}
