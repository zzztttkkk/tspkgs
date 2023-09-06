import type {
  ArrayPropOptions,
  BasePropOptions,
  MapPropOptions,
  PropOptionsForNumber,
  PropOptionsForString,
  VirtualOptions,
  IModelOptions, ReturnModelType, AnyParamConstructor
} from '@typegoose/typegoose/lib/types.js'
import { type PropType, prop as tgprop, ModelOptions, getModelForClass, index } from '@typegoose/typegoose'
import console from 'console'
import * as mongoose from 'mongoose'
import { type TransactionOptions } from 'mongodb'
import { ismain } from '../internal/index.js'

interface SchemaOpts {
  exported?: boolean
}

interface SchemaInfo {
  url: string
  opts: SchemaOpts
  fields?: Map<string, PropInfo>
}

const schemaReflectInfos = new Map<any, SchemaInfo>()

export function schema (meta: { url: string }, typeopts?: IModelOptions, opts?: SchemaOpts): ClassDecorator {
  const tgfn = ModelOptions(typeopts || {})
  return function (target) {
    tgfn(target)
    const info = schemaReflectInfos.get(target)
    if (!info) {
      console.warn(`empty schema: ${target}`)
    } else {
      info.url = meta.url
      info.opts = opts || {}
    }
  }
}

interface PropOpts {
  exported?: boolean
}

type TypeOpts =
    BasePropOptions
    | ArrayPropOptions
    | MapPropOptions
    | PropOptionsForNumber
    | PropOptionsForString
    | VirtualOptions

interface PropInfo {
  typeopts?: TypeOpts
  kind?: PropType
  opts?: PropOpts
}

export function prop (typeopts?: TypeOpts, kind?: PropType, opts?: PropOpts): PropertyDecorator {
  const tgfn = tgprop(typeopts, kind)
  return function (target, propertyKey) {
    if (typeof propertyKey !== 'string') throw new Error(`${propertyKey.toString()} is not a string`)

    tgfn(target, propertyKey)

    const schemaInfo = schemaReflectInfos.get(target.constructor) || { url: '', opts: {} }
    if (!schemaInfo.fields) {
      schemaInfo.fields = new Map()
    }
    schemaInfo.fields.set(propertyKey, { typeopts, kind, opts })
    schemaReflectInfos.set(target.constructor, schemaInfo)
  }
}

const modelCache = new Map()

export function Model<T extends AnyParamConstructor<any>> (cls: T): ReturnModelType<T> {
  if (!schemaReflectInfos.has(cls)) {
    throw new Error(`${cls} is not registered by @schema`)
  }

  let model = modelCache.get(cls)
  if (model) return model
  model = getModelForClass(cls)
  modelCache.set(cls, model)
  return model
}

export class ModelHelper<T extends AnyParamConstructor<any>> {
  private readonly cls: T

  constructor (cls: T) {
    this.cls = cls
  }

  get model (): ReturnModelType<T> {
    return Model(this.cls)
  }
}

export interface TxOpts {
  session?: mongoose.ClientSession
  sessionOpts?: mongoose.ClientSessionOptions
  txOpts?: TransactionOptions
}

export async function tx<T, Args> (
  fn: (session: mongoose.ClientSession, args?: Args) => Promise<T> | T,
  args?: Args, opts?: TxOpts
): Promise<T> {
  opts = opts || {}
  let session = opts.session
  if (!session) {
    session = await mongoose.startSession(opts.sessionOpts)
  }
  if (session.inTransaction()) {
    return (await fn(session, args))
  }

  let tmp: T
  const txdoc = await session.withTransaction(
    async (_s) => {
      tmp = await fn(_s, args)
    },
    opts.txOpts
  )
  console.log(txdoc)
  return tmp!
}

if (ismain(import.meta)) {
  @schema(import.meta)
  @index({ name: 1 }, { unique: true })
  class User {
    @prop()
      name!: string
  }

  await mongoose.connect('mongodb://ztk:123456@localhost:27017/tspkgs')

  async function intx (session: mongoose.ClientSession) {
    const model = Model(User)
    const doc = (await model.findOne({ name: 'ztk' }))!
    doc.name = 'me'
    await doc.save({ session })
  }

  await tx(intx, undefined, { txOpts: {} })

  await mongoose.disconnect()
}
