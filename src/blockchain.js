class Blcok {
  constructor(index, hash, previousHash, timestamp, data) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

// The genesis block has to be hardcoded, so we have to type!
const genesisBlock = new Blcok(
  0,
  "E5B9D14256F1684580288FECDEFB5095390D901A43AC7C44428E59EEB5A84C18",
  null,
  1531094133.16,    //new Date().getTime / 1000
  "This is the genesis!!"
);

let blockchain = [genesisBlock];

console.log(blockchain);