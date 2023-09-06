import { sleep } from '../internal/index.js'

const runningTask = new Set<string>()

export function begin (name: string) {
  runningTask.add(name)
}

export function end (name: string) {
  runningTask.delete(name)
}

export async function wait () {
  while (runningTask.size > 0) {
    await sleep(100)
  }
}
