import { EventEmitter } from "stream"

export const once = (event: EventEmitter, name: string) =>
  new Promise((resolve) => {
    event.once(name, resolve)
  })
