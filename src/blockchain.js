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
  CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

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