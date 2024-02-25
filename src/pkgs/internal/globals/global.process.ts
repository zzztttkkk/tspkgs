import "./global.types.js";

const BeforeExitActions = [] as Action[];

function BeforeProcessExit(action: Action) {
	BeforeExitActions.push(action);
}

let flag = false;
async function exec() {
	if (flag) return;
	flag = true;

	for (const action of BeforeExitActions) {
		await action();
	}
	process.exit(0);
}

for (const signal of [
	"SIGINT",
	"SIGTERM",
	"SIGKILL",
	"SIGQUIT",
] as NodeJS.Signals[]) {
	process.on(signal, exec);
}

process.on("exit", exec);

Object.defineProperty(global, "BeforeProcessExit", {
	value: BeforeProcessExit,
	writable: false,
	configurable: false,
	enumerable: false,
});

declare global {
	function BeforeProcessExit(action: Action): void;
}
