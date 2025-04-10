import { WebSocketServer } from "ws";

declare global {
  var wsServer: WebSocketServer | undefined;
}

export {};
