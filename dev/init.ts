// const fetch = (...args:any) => import('node-fetch').then(({default: fetch}) => fetch.apply(null, args));
// const fetch = require('node-fetch');
const ports = [1,2,3,4,5];
ports.forEach(cipher => {
  const reqOptions = {
    method:"POST",
    body: JSON.stringify({ newNodeUrl: `http://localhost:300${cipher}` }),
    headers: { 'Content-Type': 'application/json' }
  }
  fetch(`http://localhost:3001/register-and-broadcast-node`, reqOptions);
}) 
