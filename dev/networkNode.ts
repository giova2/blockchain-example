import express from 'express'
import bodyParser from 'body-parser';
import Blockchain from './blockchain';
import {createId} from'./utils';
import { CanBeAddedArguments } from './types/networkNode';
import {Block, Transaction} from './types/blockchain';
const fetch = require('node-fetch');
const app = express()
// const fetch = (...args:any) => import('node-fetch').then(({default: fetch}) => fetch.apply(null, args));

const port = process.argv[2];

const nodeAddress = createId();

const bitcoin = Blockchain();

const canBeAdded = ({ networkNodes, currentNodeUrl, newNodeUrl}: CanBeAddedArguments): boolean =>{
  const notCurrentNode = currentNodeUrl !== newNodeUrl;
  return notCurrentNode && !networkNodes.includes(newNodeUrl)
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


app.get('/blockchain', function (req, res) {
  res.send(bitcoin);
})

app.get('/consensus', function (req, res) {
  const requestPromises: Array<Promise<any>> = [];
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    requestPromises.push(fetch(`${networkNodeUrl}/blockchain`).then((res: any) => res.json()));
  })
  Promise.all(requestPromises)
  .then(blockchains =>{
    const currentChainLength = bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain =  null;
    let newPendingTransactions: Array<Transaction> = [];
    blockchains.forEach(blockchain => {
      if(blockchain.chain.length > maxChainLength){
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions
      }
    })
    if(!newLongestChain || (newLongestChain && !bitcoin.isValidChain(newLongestChain))){
      res.json({
        note: 'Current chain has not been replaced.',
        chain: bitcoin.chain
      })
    }else {
      //if(newLongestChain && bitcoin.isValidChain(newLongestChain))
      bitcoin.chain = newLongestChain;
      bitcoin.pendingTransactions = newPendingTransactions;
      res.json({
        note: 'this chain has been replaced.',
        chain: bitcoin.chain
      })
    }
  })
})

app.post('/transaction', function (req, res) {
  const newTransaction = req.body;
  const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
  res.json({note: `Transaction will be added in block ${blockIndex}`});
})

app.post('/transaction/broadcast', function (req, res) {
  const {amount, sender, recipient} = req.body;
  const newTransaction = bitcoin.createNewTransaction({ amount, sender, recipient });
  bitcoin.addTransactionToPendingTransactions(newTransaction);
  const requestPromises: Array<Promise<any>> = [];

  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ ...newTransaction }),
      headers: { 'Content-Type': 'application/json' }
    }
    const response = fetch(`${networkNodeUrl}/transaction`, requestOptions)
    .catch((err: any)=>{
      console.log('error en la transaction broadcast', {err})
    });
    requestPromises.push(response);
  });
  Promise.all(requestPromises)
  .then(data => {
    res.json({note:'Transaction created an broadcasted successfully'});
  })
})

app.get('/mine', function (req, res) {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock.hash;
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock.index +1
  }
  const nonce = bitcoin.proofOfWork({previousBlockHash, currentBlockData} );
  const blockHash = bitcoin.hashBlock({ previousBlockHash, currentBlockData, nonce} );

  const newBlock = bitcoin.createNewBlock({nonce, previousBlockHash, hash: blockHash});
  const requestPromises: Array<Promise<Block>> = [];
  // we loop through all the nodes on the network to share the new block we just created
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ newBlock }),
      headers: { 'Content-Type': 'application/json' }
    }
    console.log({networkNodeUrl});
    const response: Promise<any> = fetch(`${networkNodeUrl}/receive-new-block`, requestOptions)
    .catch((err: any)=>{
      console.log('error en mine', {err})
    });
    requestPromises.push(response);
  })
  // When all the promises are resolved, which means all the nodes received the new block, we create and broadcast a new transaction to give a reward to the miner
  Promise.all(requestPromises)
  .then(data => {
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ amount: 12.5, sender: "00", recipient: nodeAddress }),
      headers: { 'Content-Type': 'application/json' }
    }
    return fetch(`${bitcoin.currentNodeUrl}/transaction/broadcast`, requestOptions)
    .catch((err: any)=>{
      console.log('error broadcasting the reward', {err})
    });
  })
  // once all the nodes have the transaction, we return a message of success
  .then(data =>{
    bitcoin.pendingTransactions = [];
    res.json({
      note: "New block mined & broadcast successfully",
      newBlock,
    })
  })
  
})

// resgister a node and broadcast it in the network
app.post('/register-and-broadcast-node', function(req,res){
  const {newNodeUrl} =  req.body;
  if(!bitcoin.networkNodes.includes(newNodeUrl) && bitcoin.currentNodeUrl !== newNodeUrl){
    bitcoin.networkNodes.push(newNodeUrl)
  }
  const registerNodesPromises: Array<Promise<any>> = []
  bitcoin.networkNodes.forEach((networkNodeUrl)=>{
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ newNodeUrl }),
      headers: { 'Content-Type': 'application/json' }
    }
    const response = fetch(`${networkNodeUrl}/register-node`, requestOptions)
    .catch((err: any)=>{
      console.log('error en la primera parte', {err})
    });
    registerNodesPromises.push(response);
  });
  Promise.all(registerNodesPromises)
  .then(data => {
    const allNetworkNodes = [ ...bitcoin.networkNodes, bitcoin.currentNodeUrl];
    const bulkRegisterOptions = {
      method: 'POST',
      body: JSON.stringify({ allNetworkNodes }),
      headers: { 'Content-Type': 'application/json' }
    };
    
    const jsonResponse = fetch(`${newNodeUrl}/register-nodes-bulk`, bulkRegisterOptions)
    .catch((err: any)=>{
      console.log('error en la segunda parte', {newNodeUrl, err})
    });
    res.json({ note: 'New node registered with network successfully'});
  })
});


//register a node with the network
app.post('/register-node', function(req,res){
  const { newNodeUrl } = req.body;
  const { networkNodes, currentNodeUrl } = bitcoin;
  if(canBeAdded({ networkNodes, currentNodeUrl, newNodeUrl})){
    bitcoin.networkNodes.push(newNodeUrl); 
  }
  res.json({note: 'new node registered successfully.'})
});

// register multiple nodes at once
app.post('/register-nodes-bulk', function(req,res){
  const { allNetworkNodes } = req.body;
  (allNetworkNodes || []).forEach((newNodeUrl:string) =>{
    const { networkNodes, currentNodeUrl } = bitcoin;
    if(canBeAdded({ networkNodes, currentNodeUrl, newNodeUrl})){
      bitcoin.networkNodes.push(newNodeUrl);
    }
  })
  res.json({note: 'nodes registered successfully.'})
});

app.post('/receive-new-block', function (req, res) {
  const {newBlock} = req.body;
  const lastBlock = bitcoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock['index'] +1 === newBlock['index'];
  if(correctHash && correctIndex){
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTransactions = [];
    res.json({
      note: "new block received and accepted",
      newBlock
    })
  }else{
    res.json({
      note: 'New block rejected.',
      newBlock
    })
  }

})
 
app.listen(port, () =>{
  console.log(`Listening on port ${port}..`)
})