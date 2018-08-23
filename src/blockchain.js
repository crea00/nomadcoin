const CryptoJS = require("crypto-js"),
  _ = require("lodash"),
  Wallet = require("./wallet"),
  Mempool = require("./mempool"),
  Transactions = require("./transactions"),
  hexToBinary = require("hex-to-binary");

const {
  getBalance,
  getPublicFromWallet,
  createTx,
  getPrivateFromWallet
} = Wallet;

const { createCoinbaseTx, processTxs } = Transactions;

const { addToMempool, getMempool } = Mempool;

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

// The genesis block has to be hardcoded, so we have to type!
const genesisBlock = new Block(
  0,
  "E5B9D14256F1684580288FECDEFB5095390D901A43AC7C44428E59EEB5A84C18",
  null,
  1531657523,    //Math.round(new Date().getTime() / 1000)
  "This is the genesis!!",
  0,
  0
);

let blockchain = [genesisBlock];

let uTxOuts = [];

const getNewestBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => Math.round(new Date().getTime() / 1000);

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
  CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce).toString();

const createNewBlock = () => {
  const coinbaseTx = createCoinbaseTx(
    getPublicFromWallet(),
    getNewestBlock().index + 1
  );
  const blockData = [coinbaseTx].concat(getMempool());
  return createNewRawBlock(blockData);
};

const createNewRawBlock = data => {
  const previousBlock = getNewestBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const difficulty = findDifficulty();
  const newBlock = findBlock(
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data,
    difficulty
  );
  addBlockToChain(newBlock);
  // Circular dependency가 생기는 것을 막기위해 
  require("./p2p").broadcastNewBlock();
  return newBlock;
};

const findDifficulty = () => {
  const newestBlock = getNewestBlock();
  if (
    newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0
    && newestBlock.index !== 0
  ) {
    // calculate new difficulty
    return calculateNewDifficulty(newestBlock, getBlockchain());
  } else {
    return newestBlock.difficulty;
  }
};

const calculateNewDifficulty = (newestBlock, blockchain) => {
  const lastCalculatedBlock =
    blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeExpected =
    BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;
  if (timeTaken < timeExpected / 2) {
    return lastCalculatedBlock.difficulty + 1;
  } else if (timeTaken > timeExpected * 2) {
    return lastCalculatedBlock.difficulty - 1;
  } else {
    return lastCalculatedBlock.difficulty;
  }
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0;
  // Infinite loop
  while (true) {
    console.log("Current nonce", nonce);
    const hash = createHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      nonce
    );
    // to do: check amount of zeros (hashMatchesDifficulty)
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(
        index,
        hash,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce
      );
    }
    nonce++;
  }
};

const hashMatchesDifficulty = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredZeros = "0".repeat(difficulty);
  console.log('Trying difficulty:', difficulty, 'with hash', hashInBinary);
  return hashInBinary.startsWith(requiredZeros);
};

const getBlocksHash = block =>
  createHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.nonce
  );

const isTimeStampValid = (newBlock, oldBlock) => {
  return (
    oldBlock.timestamp - 60 < newBlock.timestamp
    && newBlock.timestamp - 60 < getTimestamp()
  );
};

const isBlockValid = (candidateBlock, latestBlock) => {
  if (!isBlockStructureValid(candidateBlock)) {
    console.log("The candidate block structure is not valid");
    return false;
  } else if (latestBlock.index + 1 !== candidateBlock.index) {
    console.log("The candidate block does not have a valid index");
    return false;
  } else if (latestBlock.hash !== candidateBlock.previousHash) {
    console.log("The previousHash of the candidate block is not the hash of the latest block");
    return false;
  } else if (getBlocksHash(candidateBlock) !== candidateBlock.hash) {
    console.log("The hash of this block is invalid");
    return false;
  } else if (!isTimeStampValid(candidateBlock, latestBlock)) {
    console.log("The timestamp of this block is dodgy");
    return false;
  }
  return true;
};

const isBlockStructureValid = block => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "object"
  );
};

const isChainValid = candidateChain => {
  const isGenesisValid = block => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };
  if (!isGenesisValid(candidateChain[0])) {
    console.log("The candidateChains's genesisBlock is not the same as our genesisBlock");
    return false;
  }
  // we don't need to validate the genesisblock because the genesisBlock doesn't have a previousHash
  // so we start with 1(second block)
  for (let i = 1; i < candidateChain.length; i++) {
    if (!isBlockValid(candidateChain[i], candidateChain[i - 1])) {
      return false;
    }
  }
  return true;
};

const sumDifficulty = anyBlockchain =>
  anyBlockchain
    .map(block => block.difficulty)
    .map(difficulty => Math.pow(2, difficulty))
    .reduce((a, b) => a + b);

const replaceChain = candidateChain => {
  // Because we always want to get the longer blockchain
  if (
    isChainValid(candidateChain) &&
    sumDifficulty(candidateChain) > sumDifficulty(getBlockchain())
  ) {
    blockchain = candidateChain;
    return true;
  } else {
    return false;
  }
};

const addBlockToChain = candidateBlock => {
  if (isBlockValid(candidateBlock, getNewestBlock())) {
    const processedTxs = processTxs(
      candidateBlock.data,
      uTxOuts,
      candidateBlock.index
    );
    if (processedTxs === null) {
      console.log("Couldn't process txs");
      return false;
    } else {
      blockchain.push(candidateBlock);
      uTxOuts = processedTxs;
      return true;
    }
    return true;
  } else {
    return false;
  }
};

const getUTxOutList = () => _.cloneDeep(uTxOuts);

const getAccountBalance = () =>
  getBalance(getPublicFromWallet(), uTxOuts);

const sendTx = (address, amount) => {
  const tx = createTx(address, amount, getPrivateFromWallet(), getUTxOutList());
  addToMempool(tx, getUTxOutList());
  return tx;
};

module.exports = {
  getNewestBlock,
  getBlockchain,
  createNewBlock,
  isBlockStructureValid,
  addBlockToChain,
  replaceChain,
  getAccountBalance,
  sendTx
};