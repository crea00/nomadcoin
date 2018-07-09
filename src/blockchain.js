const CryptoJS = require("crypto-js");

class Block {
  constructor(index, hash, previousHash, timestamp, data) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

// The genesis block has to be hardcoded, so we have to type!
const genesisBlock = new Block(
  0,
  "E5B9D14256F1684580288FECDEFB5095390D901A43AC7C44428E59EEB5A84C18",
  null,
  1531094133.16,    //new Date().getTime() / 1000
  "This is the genesis!!"
);

let blockchain = [genesisBlock];

const getLastBlock = () => blockchain[blockchain.length -1 ];

const getTimestamp = () => new Date().getTime() / 1000;

const createHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();

const createNewBlock = data => {
  const previousBlock = getLastBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const newHash = createHash(
    newBlockIndex, 
    previousBlock.hash, 
    newTimestamp, 
    data
  );
  const newBlock = new Block(
    newBlockIndex,
    newHash,
    previousBlock.hash,
    newTimestamp,
    data
  );
  return newBlock;
};

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);

const isNewBlockValid = (candidateBlock, latestBlock) => {
  if(latestBlock.index + 1 !== candidateBlock.index) {
    console.log('The candidate block does not have a valid index');
    return false;
  } else if(latestBlock.hash !== candidateBlock.previousHash) {
    console.log("The previousHash of the candidate block is not the hash of the latest block");
    return false;
  } else if(getBlocksHash(candidateBlock) !== candidateBlock.hash) {
    console.log("The hash of this block is invalid");
    return false;
  } 
  return true;
};

const isNewStructureValid = () => {
  return (
    typeof block.idnex === 'number' &&
    typeof block.hash === 'string' &&
    typeof block.previousHash === 'string' &&
    typeof block.timestamp === 'number' && 
    typeof block.data === 'string'
  );
};