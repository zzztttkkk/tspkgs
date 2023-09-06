import * as schedule from 'node-schedule'
import * as crypto from 'crypto'
import { begin, end } from './internal.js'

export interface CronOpts {
  name?: string
}

export function Cron (
  rule: string,
  fn: () => any,
  opts?: CronOpts
): string {
  opts = opts || {}
  if (!opts.name) {
    opts.name = crypto.randomUUID()
  }

  const name = `Cron:${opts.name}`

  const cb = async () => {
    try {
      begin(name)
    } finally {
      end(name)
    }
  }

  const oldjob = schedule.scheduledJobs[opts.name]
  if (oldjob) oldjob.cancel()
  return schedule.scheduleJob(opts.name, rule, cb).name
}
