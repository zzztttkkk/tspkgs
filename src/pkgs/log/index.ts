import { Level } from './level.js'
import { Time } from '../time/index.js'
import util from 'util'
import { type Emitter, type Handler } from './types.js'
import chalk from 'chalk'
import { type Buffer } from 'node:buffer'
import console from 'console'
import * as process from 'process'
import { OnDeath } from '../internal/death.js'
import { sleep } from '../internal/index.js'

class G {
  private readonly handler?: Handler
  private readonly emitters: Map<Level, Emitter>

  constructor () {
    this.emitters = new Map()
  }

  handle (level: Level, ...args: any[]) {
    const now = Date.now()
    if (this.handler) {
      return this.handler.handle(level, now, ...args)
    }

    const buf = [] as string[]
    buf.push(chalk.black(`[${Level[level]}]`))
    buf.push(' ')
    buf.push(chalk.yellow(new Time(now).format('yyyy-LL-dd HH:mm:ss.SSS[ZZZ]')))
    buf.push('\r\n')
    for (const arg of args) {
      buf.push('\t')
      if (typeof arg === 'string') {
        buf.push(arg)
      } else {
        buf.push(util.inspect(arg, { colors: true, depth: 3, sorted: true }))
      }
      buf.push('\r\n')
    }
    return buf.join('')
  }

  emit (level: Level, item: Buffer | string) {
    const emitter = this.emitters.get(level)
    if (emitter) {
      emitter.emit(item)
      return
    }
    if (typeof item === 'string') {
      console.log(item)
    } else {
      console.log(item.toString())
    }
  }

  async close () {
    const ps = [] as Array<Promise<void>>
    for (const emitter of this.emitters.values()) {
      ps.push(emitter.close())
    }
    for (const result of (await Promise.allSettled(ps))) {
      if (result.status === 'rejected') {
        console.error(result.reason)
      }
    }
  }
}

const g = new G()

OnDeath(g.close.bind(g))

function log (level: Level, ...args: any[]) {
  g.emit(level, g.handle(level, ...args))
}

export function Info (...args: any[]) {
  log(Level.Info, ...args)
}

export function Debug (...args: any[]) {
  log(Level.Debug, ...args)
}

export function Warn (...args: any[]) {
  log(Level.Warn, ...args)
}

export function Err (...args: any[]) {
  log(Level.Err, ...args)
}

await sleep(86400_000)
