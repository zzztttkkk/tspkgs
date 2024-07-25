const NewLine = "\n".charCodeAt(0);

export async function* lines(
	rs: NodeJS.ReadableStream,
	opts?: {
		encoding?: BufferEncoding;
		maxlength?: number;
	},
): AsyncGenerator<string, void, undefined> {
	const remains: Buffer[] = [];
	let remainsize: number = 0;

	for await (const tmp of rs as {
		[Symbol.asyncIterator](): AsyncIterableIterator<Buffer>;
	}) {
		let idx = 0;
		while (idx < tmp.length) {
			const _idx = tmp.indexOf(NewLine, idx);
			if (_idx < 0) {
				const ele = tmp.subarray(idx, undefined);
				remains.push(ele);
				remainsize += ele.length;
				if (opts?.maxlength && remainsize > opts.maxlength) {
					throw new Error("line too long");
				}
				break;
			}
			yield tmp.subarray(idx, _idx).toString(opts?.encoding);
			idx = _idx + 1;
		}
	}

	if (remains.length > 0) {
		yield Buffer.concat(remains).toString(opts?.encoding);
	}
}
