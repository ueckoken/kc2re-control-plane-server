import crypto from "crypto"
import { getClientIp } from "request-ip"
import WebSocket, { Server } from "ws"
import type {
  ClientVerifier,
  CloseHandler,
  ConnectionHandler,
  MessageHandler,
  OpenHandler,
} from "./app"

const TOKEN = process.env.TOKEN

if (TOKEN === undefined) {
  throw new Error("environment variable TOKEN is not provided")
}

const TOKEN_BUFFER = Buffer.from(TOKEN)

function multicast(sockets: Iterable<WebSocket>, message: any) {
  for (const ws of sockets) {
    ws.send(message)
  }
}

function broadcast(wss: Server, message: any) {
  multicast(wss.clients, message)
}

export const clientVerfier: ClientVerifier = (request) => {
  const clientIP = getClientIp(request)
  console.log(`recieved a request from ${clientIP}`)
  if (request.url === undefined) {
    return false
  }
  // the correct way to parse request.url
  // ref: https://nodejs.org/dist/latest/docs/api/http.html#http_message_url
  const url = new URL(request.url, `http://${request.headers.host}`)
  const token = url.searchParams.get("t")
  if (
    token === null ||
    token.length !== TOKEN.length ||
    !crypto.timingSafeEqual(Buffer.from(token), TOKEN_BUFFER)
  ) {
    return false
  }
  return true
}

export const onConnection: ConnectionHandler = (wss, ws, request) => {
  console.log("recieved a connection")
}

export const onOpen: OpenHandler = (wss, ws) => {
  console.log("opened a connection")
}

export const onMessage: MessageHandler = (wss, ws, message) => {
  console.log("recieved a message: ", message)
  broadcast(wss, message)
}

export const onClose: CloseHandler = (wss, ws) => {
  console.log("closing a connection")
}
