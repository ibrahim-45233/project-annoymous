const { Worker, isMainThread, parentPort } = require('worker_threads');
const { Chess } = require('chess.js');

if (isMainThread) {
  const worker = new Worker(__filename);
  const chess = new Chess();
  const maxTurns = 5; // 5 full turns (10 half-moves)
  let turnsPlayed = 0;
  let gameStarted = false;

  console.log('=== STARTING STOCKFISH ARENA MULTI-MOVE VALIDATION TEST ===\n');

  worker.on('message', msg => {
    if (typeof msg !== 'string') return;

    if (msg.includes('uciok')) {
      console.log('[UCI] Engine initialized: uciok');
      worker.postMessage('isready');
    } else if (msg.includes('readyok')) {
      if (!gameStarted) {
        gameStarted = true;
        console.log('[UCI] Engine ready: readyok');
        console.log('[GAME] Starting new game with Stockfish...\n');
        worker.postMessage('ucinewgame');
        playNextHumanMove();
      }
    } else if (msg.startsWith('bestmove')) {
      const parts = msg.trim().split(' ');
      const bestMove = parts[1];
      console.log(`[STOCKFISH] Calculated Best Move: ${bestMove} (${msg.trim()})`);

      if (!bestMove || bestMove === '(none)') {
        console.error('FAILED: Stockfish returned empty or none move');
        process.exit(1);
      }

      // Parse UCI to chess.js move
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promo = bestMove.length > 4 ? bestMove[4] : undefined;

      try {
        const moveResult = chess.move({ from, to, promotion: promo });
        if (!moveResult) {
          console.error(`FAILED: Stockfish move ${bestMove} was rejected as illegal by chess.js!`);
          process.exit(1);
        }
        console.log(`[VALIDATED LEGAL] Stockfish played: ${moveResult.san}`);
        console.log(`[BOARD FEN] ${chess.fen()}\n`);

        turnsPlayed++;
        if (turnsPlayed < maxTurns) {
          playNextHumanMove();
        } else {
          console.log('====================================================');
          console.log('🎉 ALL STOCKFISH ENGINE TURNS VERIFIED 100% LEGAL!');
          console.log('====================================================');
          console.log('Final Board State:');
          console.log(chess.ascii());
          console.log('\nPGN Notation:');
          console.log(chess.pgn());
          setTimeout(() => process.exit(0), 100);
        }
      } catch (err) {
        console.error('Error applying Stockfish move:', err);
        process.exit(1);
      }
    }
  });

  function playNextHumanMove() {
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      console.log('Game over!');
      process.exit(0);
    }

    // Pick a solid opening move or first legal move
    let chosen = legalMoves[0];
    if (turnsPlayed === 0) {
      chosen = legalMoves.find(m => m.san === 'e4') || legalMoves[0];
    } else if (turnsPlayed === 1) {
      chosen = legalMoves.find(m => m.san === 'Nf3') || legalMoves[0];
    } else {
      // Pick a developing piece move
      chosen = legalMoves.find(m => ['n', 'b', 'p'].includes(m.piece)) || legalMoves[0];
    }

    const move = chess.move(chosen);
    console.log(`[HUMAN] Turn ${turnsPlayed + 1}: Played ${move.san}`);
    console.log(`[UCI] Sending position: ${chess.fen()}`);
    worker.postMessage(`position fen ${chess.fen()}`);
    worker.postMessage('go depth 4 movetime 500');
  }

  worker.on('error', err => {
    console.error('Worker thread error:', err);
    process.exit(1);
  });

} else {
  // In worker thread: wrap stockfish.js
  global.postMessage = (msg) => parentPort.postMessage(msg);
  parentPort.on('message', (msg) => {
    if (global.onmessage) global.onmessage({ data: msg });
  });

  require('./node_modules/stockfish.js/stockfish.js');
  setTimeout(() => {
    if (global.onmessage) global.onmessage({ data: 'uci' });
  }, 100);
}
