const WebSockets = require("ws");

const sockets = [];

const getSockets = () => sockets;

// HTTP, HTTPS, web socket(ws), web socket secure(wss)는 
// 서로 다른 protocol이므로 모두 같은 port에서 존재할 수 있다.
const startP2PServer = server => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on("connection", ws => {
    console.log(`Hello Socket`);
  });
  console.log("Nomadcoin P2P Server Running!");
};

const initSocketConnection = socket => {
  sockets.push(socket);
};

const connectToPeers = newPeer => {
  const ws = new WebSockets(newPeer);
  ws.on("open", () => {
    initSocketConnection(ws);
  })
};

module.exports = {
  startP2PServer,
  connectToPeers
};