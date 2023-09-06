import * as luxon from 'luxon'
import { ismain } from '../internal/index.js'
import console from 'console'

export function Zone (offset: number): luxon.Zone {
  return luxon.FixedOffsetZone.instance(offset * 60)
}

export class Time {
  private readonly _utcms

  constructor ()
  constructor (d: Date)
  constructor (ms: number)
  constructor (txt: string, format: string, fmtopts?: luxon.DateTimeOptions)

  constructor (obj?: Date | number | string, fmt?: string, fmtopts?: luxon.DateTimeOptions) {
    if (obj == null) {
      this._utcms = Date.now()
      return
    }

    if (obj instanceof Date) {
      this._utcms = obj.getTime()
      return
    }

    switch (typeof obj) {
      case 'number': {
        this._utcms = obj
        break
      }
      case 'string': {
        if (!fmt) throw new Error('empty time format')
        this._utcms = luxon.DateTime.fromFormat(obj, fmt, fmtopts).toMillis()
        break
      }
      default: {
        throw new Error('bad args')
      }
    }
  }

  get utcms (): number {
    return this._utcms
  }

  // https://moment.github.io/luxon/#/formatting?id=table-of-tokens
  format (fmt: string, zone?: string | luxon.Zone): string {
    return luxon.DateTime.fromMillis(this._utcms, { zone }).toFormat(fmt)
  }

  diff (another: Time): luxon.Duration {
    return luxon.Duration.fromMillis(this._utcms - another._utcms)
  }
}

if (ismain(import.meta)) {
  const diff = new Time(1693895745365).diff(new Time(0))
  console.log(diff)
}
