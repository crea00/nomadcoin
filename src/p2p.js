const WebSockets = require("ws");

const sockets = [];

const getSockets = () => sockets;

// HTTP, HTTPS, web socket(ws), web socket secure(wss)는 
// 서로 다른 protocol이므로 모두 같은 port에서 존재할 수 있다.
const startP2PServer = server => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on("connection", ws => {
    initSocketConnection(ws);
    console.log(`Hello Socket`);
  });
  console.log("Nomadcoin P2P Server Running!");
};

const initSocketConnection = socket => {
  sockets.push(socket);
  handleSocketError(socket);
  socket.on("message", (data) => {
    console.log(data);
  });
  setTimeout(() => {
    socket.send("welcome");
  }, 5000);
};

const handleSocketError = ws => {
  const closeSocketConnection = ws => {
    ws.close()
    // 죽은 socket이 있으면 나중에 array에 메세지를 보낼때 에러가 날 수 있으므로 지운다.
    sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on("close", () => closeSocketConnection(ws));
  ws.on("error", () => closeSocketConnection(ws));
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