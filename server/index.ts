/// <reference no-default-lib="true"/>
/// <reference types="@cloudflare/workers-types" />

import type { PartyKitServer } from "partykit/server";

import { getSchema } from "@party-chat/shared/schemas";
import type {
  MessageType,
  MessagePayload,
  RawMessage,
} from "@party-chat/shared/schemas";

const WS_READYSTATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

class RoomControl {
  #conns: Set<WebSocket>;
  constructor() {
    this.#conns = new Set<WebSocket>();
  }

  closeConnection(conn: WebSocket) {
    try {
      conn.close();
    } catch (e) {
      console.warn("failed to close connection", e);
    }
    if (this.#conns.has(conn)) {
      this.#conns.delete(conn);
    }
  }

  addConnection(conn: WebSocket) {
    this.#conns.add(conn);
  }

  broadcast(rawMsg: RawMessage) {
    const connIter = this.#conns.values();
    let conn: WebSocket;
    while ((conn = connIter.next()?.value)) {
      if (
        conn.readyState !== undefined &&
        conn.readyState !== WS_READYSTATE.CONNECTING &&
        conn.readyState !== WS_READYSTATE.OPEN
      ) {
        this.closeConnection(conn);
        return;
      }
      try {
        conn.send(JSON.stringify(rawMsg));
      } catch (e) {
        this.closeConnection(conn);
      }
    }
  }
}

const roomControl = new RoomControl();

function handleMessage(type: MessageType, payload: MessagePayload) {
  switch (type) {
    case "textMessage":
      roomControl.broadcast({ type: "textMessage", payload });
      break;
    default:
  }
}

export default {
  onConnect(ws, _room) {
    // This is invoked whenever a user joins a room
    ws.addEventListener("message", (evt: MessageEvent) => {
      const data = evt.data;
      try {
        if (typeof data === "string") {
          const { type, payload } = JSON.parse(data);
          const schema = getSchema(type);
          if (!schema) throw new Error("Invalid schema!");
          for (let key in payload) {
            if (!(key in schema))
              throw new Error(`Invalid prop '${key}' in object!`);
            if (typeof payload[key] !== schema[key])
              throw new Error(
                `Invalid type '${payload[key]}' for prop '${key}'. Expected: '${schema[key]}'`
              );
          }
          // Validation complete
          handleMessage(type, payload);
        } else {
          throw new TypeError("Message not a string!");
        }
      } catch (e) {
        console.error(e);
        throw new TypeError("Message must be valid message schema as JSON!");
      }

      roomControl.addConnection(ws);
    });
  },
} satisfies PartyKitServer;
