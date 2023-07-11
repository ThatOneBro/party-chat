/// <reference no-default-lib="true"/>
/// <reference lib="dom"/>

declare const PARTYKIT_HOST: string | undefined;

import { useEffect, useState } from "react";
import PartySocket from "partysocket";
import "./App.css";

const partykitHost =
  typeof PARTYKIT_HOST === "undefined" ? "localhost:1999" : PARTYKIT_HOST;

const ConnectionState = {
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  FAILED: "FAILED",
  NOT_CONNECTED: "NOT_CONNECTED",
} as const;

type ConnectionStateType = keyof typeof ConnectionState;

function App() {
  const [connectionState, setConnectionState] = useState<ConnectionStateType>(
    ConnectionState.NOT_CONNECTED
  );
  const [msgs, setMsgs] = useState<string[]>([]);

  useEffect(() => {
    if (connectionState !== "NOT_CONNECTED") return;
    setConnectionState(ConnectionState.CONNECTING);
    const partySocket = new PartySocket({
      host: partykitHost,
      room: "some-room",
    });

    partySocket.onerror = err => console.error({ err });
    partySocket.onclose = evt => console.log("closed", evt);
    partySocket.onopen = () => {
      partySocket.send("ping");
      setConnectionState(ConnectionState.CONNECTED);
    };
    partySocket.onmessage = evt => {
      setMsgs(s => [...s, evt.data]);
    };

    return () => {
      partySocket.close();
    };
  }, []);

  return (
    <>
      {msgs.map((msg, i) => {
        return <div key={i}>{msg}</div>;
      })}
    </>
  );
}

export default App;
