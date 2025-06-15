import { WebSocketServer } from "ws";

declare global {
  var wsServer: WebSocketServer | undefined;
  var pingerStarted: boolean | undefined;
}

export {};
