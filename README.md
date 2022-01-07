Intro

LEDGE: Each Ledge has the entire history of all the transactions made since the blockchain started.

BLOCK:
A block has several props

- index: is the index of the block
- tiemstamp
- newTransactions: a history of the transactions made
- nonce: Is the 'certificate' of the proof of work.
- hash: that hash refers to the newTransactions history
- previousBlockHash: this refers to the previous transactions block.

PROOF OF WORK:

Is the process of checking that a certain block is legitimate by mining it. I mean by this for example, generate a hash that has four zeros at the begining. And we do that by try and error, but we have the `previousBlockHash`and `currentBlockData` which are always the same.. well, the answer is in the `nonce`, we change this number until the hash generated accomplish what we are looking for.
This is why blockchain is so secure, all the blocks are concatenated, if you change some data in a past block, then you will need to re-mine all the subsequent blocks to achieve it, and that means a lot of computing, impossible to do also because the blockchain still growing while you try to do that and etc, this explanation might not be clear enough but I am still learning.
