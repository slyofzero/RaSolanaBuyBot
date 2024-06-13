import WebSocket from "ws";
import { errorHandler, log } from "./utils/handlers";
import { parseTxn } from "./parseTxn";

export let currentWSS: WebSocket | null = null;

export function setUpWSS(pairs: string[]) {
  currentWSS = new WebSocket(
    "wss://atlas-mainnet.helius-rpc.com/?api-key=224786e4-f3e6-4a4b-bab2-f903872b1595"
  );

  function sendRequest(ws: WebSocket) {
    const request = {
      jsonrpc: "2.0",
      id: 420,
      method: "transactionSubscribe",
      params: [
        {
          accountInclude: pairs,
        },
        {
          commitment: "confirmed",
          encoding: "jsonParsed",
          transactionDetails: "full",
          showRewards: true,
          maxSupportedTransactionVersion: 0,
        },
      ],
    };
    ws.send(JSON.stringify(request));
  }
  // handle(network, signatures);
  // Define WebSocket event handlers
  currentWSS.on("open", function open() {
    log("WebSocket is open");
    if (currentWSS) sendRequest(currentWSS); // Send a request once the WebSocket is open
  });

  currentWSS.on("message", function incoming(data) {
    const messageStr = data.toString("utf8");
    try {
      const messageObj = JSON.parse(messageStr);
      if (messageObj.result) {
        log("Received:", messageObj);
      } else {
        const signature = messageObj.params.result.signature;
        if (!signature) return;
        parseTxn(messageObj);
        //handle signature here
      }
    } catch (err) {
      log("Failed to parse JSON:");
      errorHandler(err);
    }
  });

  currentWSS.on("error", function error(err) {
    log("WebSocket error:");
    errorHandler(err);
  });

  currentWSS.on("close", (code, reason) => {
    log(`Disconnected: ${code} - ${reason}`);
    process.exit(1);
    // // Attempt to reconnect after a delay
    // setTimeout(() => {
    //   log("Reconnecting...");
    //   setUpWSS(pairs);
    // }, 1000); // Reconnect after 1 second
  });
}
