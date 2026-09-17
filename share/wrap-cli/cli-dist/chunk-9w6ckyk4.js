// @bun
import {
  __esm
} from "./chunk-hhsxm2yr.js";

// src/services/mcp/InProcessTransport.ts
class InProcessTransport {
  peer;
  closed = false;
  onclose;
  onerror;
  onmessage;
  _setPeer(peer) {
    this.peer = peer;
  }
  async start() {}
  async send(message) {
    if (this.closed) {
      throw new Error("Transport is closed");
    }
    queueMicrotask(() => {
      this.peer?.onmessage?.(message);
    });
  }
  async close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.onclose?.();
    if (this.peer && !this.peer.closed) {
      this.peer.closed = true;
      this.peer.onclose?.();
    }
  }
}
function createLinkedTransportPair() {
  const a = new InProcessTransport;
  const b = new InProcessTransport;
  a._setPeer(b);
  b._setPeer(a);
  return [a, b];
}
var init_InProcessTransport = () => {};
init_InProcessTransport();

export {
  createLinkedTransportPair
};

//# debugId=582DDA595ADECDD564756E2164756E21
//# sourceMappingURL=chunk-9w6ckyk4.js.map
