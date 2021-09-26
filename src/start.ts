import process from "process"
import {
  clientVerfier,
  onClose,
  onConnection,
  onMessage,
  onOpen,
} from "./handler"
import { createAndListenServer } from "./app"

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000

const wss = createAndListenServer(
  {
    host: "0.0.0.0",
    port: PORT,
  },
  {
    verifyClientBeforeOnConnection: clientVerfier,
    onConnection: onConnection,
    onOpen: onOpen,
    onMessage: onMessage,
    onClose: onClose,
  }
)
wss.addListener("listening", () => {
  console.log("Listening WebSocket")
})
