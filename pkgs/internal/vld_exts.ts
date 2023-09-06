import * as clsvld from "clsvld/mod.ts";

export function Match(regexp: RegExp, opts?: clsvld.ValidationOptions): PropertyDecorator {
	return clsvld.ValidateBy(
		{
			name: "Match",
			constraints: [regexp],
			validator: {
				validate: (v, args): boolean => {
					if (typeof v !== "string") return false;
					return !!v.match(args!.constraints[0]);
				},
			},
		},
		opts,
	);
}

export function ExistsFilePath(opts?: clsvld.ValidationOptions) {
	return clsvld.ValidateBy(
		{
			name: "ExistsFilePath",
			constraints: [],
			validator: {
				validate: async (v, _args): Promise<boolean> => {
					if (typeof v !== "string") return false;
					try {
						return (await Deno.stat(v)).isFile;
					} catch {
						return false;
					}
				},
			},
		},
		opts,
	);
}

export function ExistsDirPath(opts?: clsvld.ValidationOptions) {
	return clsvld.ValidateBy(
		{
			name: "ExistsDirPath",
			constraints: [],
			validator: {
				validate: async (v, _args): Promise<boolean> => {
					if (typeof v !== "string") return false;
					try {
						return (await Deno.stat(v)).isDirectory;
					} catch {
						return false;
					}
				},
			},
		},
		opts,
	);
}
