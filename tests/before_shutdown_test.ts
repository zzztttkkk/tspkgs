import { sleep } from "../src/index.js";

process.RegisterBeforeShutdownAction(async () => {
	console.log("before sleep");
	await sleep(10 * 1000);
	console.log("after sleep");
});

// await (async () => {
// 	while (true) {
// 		await sleep(1000);
// 	}
// })();
