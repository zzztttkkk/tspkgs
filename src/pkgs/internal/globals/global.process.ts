import "./global.types.js";

const BeforeExitActions = [] as Action[];

function RegisterOnShutdownAction(action: Action) {
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

for (const signal of ["SIGINT", "SIGTERM"] as NodeJS.Signals[]) {
	process.on(signal, exec);
}

Object.defineProperty(process, "RegisterOnShutdownAction", {
	value: RegisterOnShutdownAction,
	writable: false,
	configurable: false,
	enumerable: false,
});

declare global {
	namespace NodeJS {
		interface Process {
			RegisterOnShutdownAction: (action: Action) => void;
		}
	}
}
