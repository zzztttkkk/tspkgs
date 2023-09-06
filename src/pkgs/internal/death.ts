import console from 'console'

type HookFunc = () => Promise<void>

const hooks = [] as HookFunc[]

export function OnDeath (fn: HookFunc) {
  hooks.push(fn)
}

const evtkeys = [
  'uncaughtException', 'exit',
  'SIGINT', 'SIGQUIT', 'SIGTERM'
] as string[]

async function handler (signal: NodeJS.Signals | Error) {
  console.log(signal)
  const ps = [] as Array<Promise<void>>
  for (const hook of hooks) {
    ps.push(hook())
  }
  for (const result of await Promise.allSettled(ps)) {
    if (result.status === 'rejected') {
      console.error(result.reason)
    }
  }

  process.exit(0)
}

for (const evtkey of evtkeys) {
  process.on(evtkey, handler)
}
