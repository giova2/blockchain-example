import SHA256 from 'sha256';
import {
  BlockchainObject,
  Blockchain,
  CreateNewBlockArguments,
  CreateNewTransactionArguments,
  HashBlockArguments,
  ProofOfWorkArguments,
  Transaction,
  Block
} from './types/blockchain';
import { createId } from './utils';
const currentNodeUrl = process.argv[3];


// Here we initialize out blockchain
function BlockChain(): BlockchainObject {
  const blockchain: Blockchain = {
    chain: [],
    pendingTransactions: [],
    currentNodeUrl: currentNodeUrl,
    networkNodes: [],
  }
  
  /**
   * this method adds a new block to our blockchain, when this method is executed, that should mean that a nonce was found, 
   * and we generated a new hash that would represent this new block and is asociated with the block before by the previousBlockHash
  */
  const createNewBlock = function ({ nonce, previousBlockHash, hash }: CreateNewBlockArguments):Block {
    const newBlock: Block = {
      index: blockchain.chain.length + 1,
      timestamp: Date.now(),
      transactions: blockchain.pendingTransactions,
      nonce,
      hash,
      previousBlockHash,
    }

    blockchain.pendingTransactions = []
    blockchain.chain.push(newBlock)

    return newBlock
  }

  /**
   * We obtain the last block of the blockchain here
   * @returns the last block of the blockchain
   */
  const getLastBlock = function (): Block {
    return blockchain.chain[blockchain.chain.length - 1]
  }

  /** Creates a new transaction
   * 
   * @param {number} amount 
   * @param {uuid} sender 
   * @param {uuid} recipient 
   * @returns 
   */
  const createNewTransaction = function ({ amount, sender, recipient }: CreateNewTransactionArguments): Transaction {
    const newTransaction: Transaction = { amount, sender, recipient, transactionId: createId() }

    return newTransaction;
  }


  /** Attach a new transaction to the pendingTransactions array of the last block in the blockchain
   * 
   * @param {Transaction} transactionObj 
   * @returns 
   */
  const addTransactionToPendingTransactions = function (transactionObj: Transaction): number {
    blockchain.pendingTransactions.push(transactionObj);
    return getLastBlock()['index'] + 1
  }

  const hashBlock = function ({
    previousBlockHash,
    currentBlockData,
    nonce
  }: HashBlockArguments): string {
    const dataAsString =
      previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData)
    const hash = SHA256(dataAsString)
    return hash
  }

  const proofOfWork = function ({
    previousBlockHash,
    currentBlockData
  }: ProofOfWorkArguments): number {
    let nonce = 0
    let hash = hashBlock({previousBlockHash, currentBlockData, nonce})
    while (hash.substring(0, 4) !== '0000') {
      nonce++
      hash = hashBlock({previousBlockHash, currentBlockData, nonce})
    }
    return nonce // this is our proof
  }

  const isValidChain = function (blockchain: Array<Block>): boolean {
    let validChain = true;
    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const prevBlock = blockchain[i - 1];
      const { nonce } = currentBlock;
      const blockHash = hashBlock({ previousBlockHash: prevBlock.hash, currentBlockData: currentBlock, nonce } );
      if (blockHash.substring(0, 4) !== '0000') {
        validChain = false;
      }
      if (currentBlock.previousBlockHash !== prevBlock.hash) {
        validChain = false;
      }
    }
    const genesiBlock = blockchain[0];
    const correctNonce = genesiBlock.nonce === 100;
    const correctPrevioiusBlockHash = genesiBlock.previousBlockHash === '0';
    const correctHash = genesiBlock.hash === '0';
    const correctTransactions = genesiBlock.transactions.length === 0;
    if (!correctNonce || !correctPrevioiusBlockHash || !correctHash || !correctTransactions) {
      validChain = false
    }
    return validChain;
  }

  createNewBlock({ nonce: 100, previousBlockHash: '0', hash: '0' })
  return {
    createNewBlock,
    getLastBlock,
    createNewTransaction,
    addTransactionToPendingTransactions,
    hashBlock,
    proofOfWork,
    isValidChain,
    ...blockchain,
  }
}

export default BlockChain
