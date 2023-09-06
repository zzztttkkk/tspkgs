import { lines } from '../fsutils/index.js'

function line (line: string, map: Map<string, string>) {
  if (line.length < 1 || line.startsWith('//')) return
  const [rk, ...vs] = line.split('=')
  const rv = vs.join('=')
  const k = rk.trim()
  let v = rv.trim()

  if (!(k.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/g))) {
    throw new Error(`ztkpkgs.env: bad key, "${k}"`)
  }

  if ((v.startsWith("'") || v.startsWith('"')) && v[0] === v[v.length - 1]) {
    v = v.slice(1, v.length - 1)
  }
  map.set(k, v)
}

export async function parse (fp: string = './.env', dest?: NodeJS.Dict<string>): Promise<Map<string, string>> {
  return await new Promise<Map<string, string>>((resolve) => {
    const kvs = new Map<string, string>()
    lines(
      fp,
      (txt) => {
        line(txt, kvs)
      },
      () => {
        resolve(kvs)
        if (dest) {
          for (const [k, v] of kvs) {
            dest[k] = v
          }
        }
      }
    )
  })
}
