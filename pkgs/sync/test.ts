async function sleep(ms: number) {
	return await new Promise<void>((resolve) => {
		setTimeout(resolve, Math.floor(ms));
	});
}

async function exec(fn: () => Promise<void>): Promise<void> {
	await sleep(Math.random() * 20);
	return await fn();
}

async function boo(idx: number) {
	await sleep(Math.random() * 20);
	await exec(async () => {
		await sleep(Math.random() * 20);
		console.log(idx);
	});
}

const ps = [] as Promise<void>[];

for (let i = 0; i < 100; i++) {
	ps.push(boo(i));
}

await Promise.all(ps);
