const { Worker, isMainThread, parentPort } = require('worker_threads');
const path = require('path');

if (isMainThread) {
  const worker = new Worker(__filename);
  worker.on('message', msg => {
    console.log('Stockfish output:', msg);
    if (typeof msg === 'string') {
      if (msg.includes('uciok')) {
        console.log('>>> SUCCESS: UCI OK received!');
        worker.postMessage('isready');
      }
      if (msg.includes('readyok')) {
        console.log('>>> SUCCESS: Ready OK received!');
        worker.postMessage('position startpos moves e2e4');
        worker.postMessage('go depth 4');
      }
      if (msg.includes('bestmove')) {
        console.log('>>> TEST PASSED: Stockfish returned real bestmove:', msg);
        setTimeout(() => process.exit(0), 100);
      }
    }
  });
  worker.on('error', err => {
    console.error('Worker error:', err);
    process.exit(1);
  });
} else {
  global.postMessage = (msg) => parentPort.postMessage(msg);
  parentPort.on('message', (msg) => {
    if (global.onmessage) global.onmessage({ data: msg });
  });
  require('./node_modules/stockfish.js/stockfish.js');
  // Send uci to start
  setTimeout(() => {
    if (global.onmessage) global.onmessage({ data: 'uci' });
  }, 100);
}
