import { type Level } from './level.js'
import { type Buffer } from 'node:buffer'

export abstract class Handler {
  abstract handle (level: Level, time: number, ...args: any[]): string | Buffer
}

export abstract class Emitter {
  abstract emit (item: string | Buffer): void

  abstract close (): Promise<void>
}

interface FileEmitterOptions {
  filename: string
  maxFileSize?: number
}

export class FileEmitter {
  constructor () {
  }
}
