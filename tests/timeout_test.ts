import { sleep } from "../src/index.js";

for (let i = 0; i < 100000; i++) {
	setTimeout(() => {}, Math.floor(Math.random() * 100000));
}

console.log(process.pid);

while (true) {
	await sleep(1000);
}
