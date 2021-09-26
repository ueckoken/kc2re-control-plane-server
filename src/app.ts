import http, { IncomingMessage } from "http"
import { Socket } from "net"
import WebSocket, { Server } from "ws"
import { onClose } from "./handler"

export type ClientVerifier = (request: IncomingMessage) => boolean

export type ConnectionHandler = (
  wss: Server,
  ws: WebSocket,
  request: IncomingMessage
) => void

export type OpenHandler = (wss: Server, ws: WebSocket) => void

export type MessageHandler = (wss: Server, ws: WebSocket, message: any) => void

export type CloseHandler = (
  wss: Server,
  ws: WebSocket,
  code: number,
  reason: string
) => void

type SocketHandlers = {
  verifyClientBeforeOnConnection: ClientVerifier
  onConnection: ConnectionHandler
  onOpen: OpenHandler
  onMessage: MessageHandler
  onClose: CloseHandler
}

type ServerOptions = {
  host: string
  port: number
}

export function createAndListenServer(
  { host, port }: ServerOptions,
  handlers: SocketHandlers
) {
  const wss = new Server({
    noServer: true,
  })
  wss.on("connection", (ws, request) => {
    const pingTimer = setInterval(() => {
      ws.ping()
    }, 30 * 1000)
    ws.on("close", (code, reason) => {
      clearInterval(pingTimer)
      onClose(wss, ws, code, reason)
    })
    ws.on("message", (data) => {
      handlers.onMessage(wss, ws, data)
    })
    ws.on("open", () => {
      handlers.onOpen(wss, ws)
    })
    handlers.onConnection(wss, ws, request)
  })
  const server = http.createServer((req, res) => {
    // send upgrade required for non-websocket connection
    const body = http.STATUS_CODES[426] || ""
    res.writeHead(426, {
      "Content-Length": body.length,
      "Content-Type": "text/plain",
    })
    res.end(body)
  })
  server.on("listening", () => {
    wss.emit("listening")
  })
  server.on("upgrade", (request, socket, head) => {
    // logic to verify client here
    // do not use WebSocketServer's `verifyClient` option because it is discouraged as documented
    // > NOTE: Use of verifyClient is discouraged. Rather handle client authentication in the upgrade event of the HTTP server. See examples for more details.
    // ref: https://github.com/websockets/ws/issues/377#issuecomment-462152231
    const canUpgrade = handlers.verifyClientBeforeOnConnection(request)
    if (!canUpgrade) {
      socket.destroy()
      return
    }
    // ref: https://github.com/websockets/ws/blob/055949fd23b0d7f6a23ba9b9532b7834909df192/lib/websocket-server.js#L110-L112
    wss.handleUpgrade(request, socket as unknown as Socket, head, (ws) => {
      wss.emit("connection", ws, request)
    })
  })
  server.listen(port, host, () => {
    console.log(`Listening HTTP on port ${port}`)
  })
  return wss
}
