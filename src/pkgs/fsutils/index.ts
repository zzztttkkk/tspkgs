import fs from 'fs'
import readline from 'readline'

export function lines (fp: string, onLine: (v: string) => void, onClose: () => void) {
  const input = fs.createReadStream(fp)
  readline.createInterface({ input, terminal: false }).on('line', onLine).on('close', onClose)
}
