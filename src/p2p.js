const WebSockets = require("ws"),
  Blockchain = require("./blockchain");

const { getLastBlock } = Blockchain;

const sockets = [];

// Message Types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

// Message Creators
const getLatest = () => {
  return {
    type: GET_LATEST,
    data: null
  };
};

const getAll = () => {
  return {
    type: GET_ALL,
    data: null
  };
};

const blockchainResponse = (data) => {
  return {
    type: BLOCKCHAIN_RESPONSE,
    data
  };
};

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

const initSocketConnection = ws => {
  sockets.push(ws);
  handleSocketMessages(ws);
  handleSocketError(ws);
};

const handleSocketMessages = ws => {
  ws.on("message", data => {

  });
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