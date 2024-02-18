export async function* lines(
	rs: NodeJS.ReadableStream,
): AsyncGenerator<string, void, undefined> {
	const lines: string[] = [];
	const remains: string[] = [];

	for await (const data of rs) {
		let idx = 0;
		while (idx < data.length) {
			const _idx = data.indexOf("\n", idx);
			if (_idx < 0) {
				remains.push((data as string).substring(idx));
				break;
			}

			lines.push((data as string).substring(idx, _idx));
			idx = _idx + 1;
		}

		if (lines.length > 0) {
			if (remains.length > 0) {
				lines[0] = `${remains.join()}${lines[0]}`;
				remains.length = 0;
			}
			yield* lines;
			lines.length = 0;
		}
	}

	if (remains.length > 0) {
		yield remains.join();
	}
}
