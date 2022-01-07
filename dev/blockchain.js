import SHA256 from 'sha256';
const {createId} = require('utils');
const currentNodeUrl = process.argv[3];


// Here we initialize out blockchain
function BlockChain()  {
  this.chain = []
  this.pendingTransactions = []
  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = []
  this.createNewBlock({nonce: 100, previousBlockHash: '0', hash: '0'})
}

/**
 * this method adds a new block to our blockchain, when this method is executed, that should mean that a nonce was found, 
 * and we generated a new hash that would represent this new block and is asociated with the block before by the previousBlockHash
*/
BlockChain.prototype.createNewBlock = function ({nonce, previousBlockHash, hash}) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce,
    hash,
    previousBlockHash,
  }

  this.pendingTransactions = []
  this.chain.push(newBlock)

  return newBlock
}

/**
 * We obtain the last block of the blockchain here
 * @returns the last block of the blockchain
 */
BlockChain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1]
}

/** Creates a new transaction
 * 
 * @param {number} amount 
 * @param {uuid} sender 
 * @param {uuid} recipient 
 * @returns 
 */
BlockChain.prototype.createNewTransaction = function ({amount, sender, recipient}){
  const newTransaction = { amount, sender, recipient, transactionId: createId() }
  
  return newTransaction;
}


/** Attach a new transaction to the pendingTransactions array of the last block in the blockchain
 * 
 * @param {} transactionObj 
 * @returns 
 */
BlockChain.prototype.addTransactionToPendingTransactions = function(transactionObj){
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()['index'] + 1
}

BlockChain.prototype.hashBlock = function ({
  previousBlockHash,
  currentBlockData,
  nonce
}) {
  const dataAsString =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData)
  const hash = SHA256(dataAsString)
  return hash
}

BlockChain.prototype.proofOfWork = function ({
  previousBlockHash,
  currentBlockData
}) {
  let nonce = 0
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
  while (hash.substring(0, 4) !== '0000') {
    nonce++
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
  }
  return nonce // this is our proof
}

BlockChain.prototype.isValidChain = function(blockchain){
  let validChain = true;
  for(let i = 1; i < blockchain.length; i++){
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i-1];
    const { transactions, index, nonce } = currentBlock;
    const blockHash = this.hashBlock(prevBlock.hash, { transactions, index }, nonce );
    if(blockHash.substring(0, 4) !== '0000'){
      validChain = false;
    }
    if(currentBlock.previousBlockHash !== prevBlock.hash){
      validChain = false;
    }
  }
  const genesiBlock = blockchain[0];
  const correctNonce = genesiBlock.nonce === 100;
  const correctPrevioiusBlockHash = genesiBlock.previousBlockHash === '0';
  const correctHash = genesiBlock.hash === '0';
  const correctTransactions = genesiBlock.transactions.length === 0;
  if(!correctNonce || !correctPrevioiusBlockHash || !correctHash || !correctTransactions){
    validChain = false
  }
  return validChain;
}



module.exports = BlockChain
