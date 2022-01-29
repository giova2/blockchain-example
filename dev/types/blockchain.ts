export type BlockchainObject = {
  createNewBlock: ({ nonce, previousBlockHash, hash }: CreateNewBlockArguments) => Block; 
  getLastBlock: () => Block
  createNewTransaction: ({ amount, sender, recipient }: CreateNewTransactionArguments) => Transaction;
  addTransactionToPendingTransactions: (transactionObj: Transaction) => number;
  hashBlock: ({ previousBlockHash, currentBlockData, nonce }: HashBlockArguments) => string;
  proofOfWork: ({ previousBlockHash, currentBlockData }: ProofOfWorkArguments) => number
  isValidChain: (blockchain: Array<Block>) => boolean;
} & Blockchain;


export type Blockchain = {
  chain: Array<Block>;
  pendingTransactions: Array<Transaction>;
  currentNodeUrl: string;
  networkNodes: Array<string>;
  // createNewBlock: (args: CreateNewBlockArguments) => Block
}

export type Block = {
  index: number;
  timestamp: number;
  transactions: Array<Transaction>;
  nonce: number;
  hash: string;
  previousBlockHash: string;
}

export type CreateNewBlockArguments ={
  nonce: number;
  previousBlockHash: string; 
  hash: string;
}

export type CreateNewTransactionArguments = {
  amount: number;
  sender: string;
  recipient: string;
}

export type HashBlockArguments = {
  previousBlockHash: string;
  currentBlockData: {
    transactions: Array<Transaction>;
    index: number;
  };
  nonce: number;
}

export type ProofOfWorkArguments = {
  previousBlockHash: string;
  currentBlockData: {
    transactions: Array<Transaction>;
    index: number;
  };
}

export type Transaction = {
  amount: number;
  sender: string;
  recipient: string;
  transactionId: string;
}