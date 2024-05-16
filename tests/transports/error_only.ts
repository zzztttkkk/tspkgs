import build from "pino-abstract-transport";
import { once } from "events";
import "../../src/index.js";

export default async function () {
	const dest = logging.dailyrotation({
		dest: "./v.err.log",
		sync: false,
	});

	await once(dest, "ready");

	return build(
		async (source: AsyncIterable<{ data: string }>) => {
			for await (const obj of source) {
				const line = obj.data as string;
				dest.write(line);
				if (!dest.write("\n")) {
					await once(dest, "drain");
				}
			}
		},
		{
			close: async () => {
				dest.end();
				await once(dest, "close");
			},
			parseLine: (line) => line,
		},
	);
}
