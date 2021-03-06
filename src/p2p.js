const WebSockets = require("ws"),
  Blockchain = require("./blockchain");

const {
  getNewestBlock,
  isBlockStructureValid,
  replaceChain,
  getBlockchain,
  addBlockToChain
} = Blockchain;

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

const blockchainResponse = data => {
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
  sendMessage(ws, getLatest());
};

const parseData = data => {
  try {
    // 받은 data을 JSON으로 만들 수 있는지 체크
    return JSON.parse(data);
  } catch (e) {
    console.log(e);
    return null;
  };
};

const handleSocketMessages = ws => {
  ws.on("message", data => {
    const message = parseData(data);
    if (message === null) {
      return;
    }
    console.log(message);
    switch (message.type) {
      case GET_LATEST:
        sendMessage(ws, responseLatest());
        break;
      case GET_ALL:
        sendMessage(ws, responseAll());
        break;
      case BLOCKCHAIN_RESPONSE:
        const receivedBlocks = message.data;
        if (receivedBlocks === null) {
          break;
        }
        handleBlockchainResponse(receivedBlocks);
        break;
    }
  });
};

const handleBlockchainResponse = receivedBlocks => {
  if (receivedBlocks.length === 0) {
    console.log("Received Blocks hava a length of 0");
    return;
  }
  const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
  if (!isBlockStructureValid(latestBlockReceived)) {
    console.log("The block structure of the block received is not valid");
    return;
  }
  const newestBlock = getNewestBlock();
  if (latestBlockReceived.index > newestBlock.index) {
    if (newestBlock.hash === latestBlockReceived.previousHash) {
      if (addBlockToChain(latestBlockReceived)) {
        broadcastNewBlock();
      }
    } else if (receivedBlocks.length === 1) {
      // to do, get all the blocks, we are waaaay behind
      sendMessageToAll(getAll());
    } else {
      replaceChain(receivedBlocks);
    }
  }
};

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const sendMessageToAll = message =>
  sockets.forEach(ws => sendMessage(ws, message));

const responseLatest = () => blockchainResponse([getNewestBlock()]);

const responseAll = () => blockchainResponse(getBlockchain());

const broadcastNewBlock = () => sendMessageToAll(responseLatest());

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
  });
};

module.exports = {
  startP2PServer,
  connectToPeers,
  broadcastNewBlock
};