export type BlockchainElem = {
  chain: Array<Blockchain>;
  pendingTransactions: Array<Transaction>;
  currentNodeUrl: string;
  networkNodes: Array<string>;
  createNewBlock: (args: CreateNewBlockArguments) => Block
}

export type Blockchain = Array<BlockchainElem>;

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
  currentBlockData: Block;
  nonce: number;
}

export type ProofOfWorkArguments = {
  previousBlockHash: string;
  currentBlockData: Block;
}

export type Transaction = {
  amount: number;
  sender: string;
  recipient: string;
  transactionId: string;
}

export type Block = {
  index: number;
  timestamp: Date;
  transactions: Array<Transaction>;
  nonce: number;
  hash: string;
  previousBlockHash: string;
}