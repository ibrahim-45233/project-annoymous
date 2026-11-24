import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess, Square, PieceSymbol, Color, Move } from 'chess.js';
import { GameStatus, MoveRecord, TimeControlConfig, TIME_CONTROL_PRESETS } from '../types/chess';
import { sounds } from '../audio/soundEffects';

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const STARTING_PIECES: Record<PieceSymbol, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

export interface CapturedState {
  whiteCaptured: PieceSymbol[]; // Pieces captured BY white (black pieces taken)
  blackCaptured: PieceSymbol[]; // Pieces captured BY black (white pieces taken)
  materialDifference: number; // Positive = white advantage, Negative = black advantage
}

export function useChessGame(initialTimeControl: TimeControlConfig = TIME_CONTROL_PRESETS[5]) {
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [turn, setTurn] = useState<Color>('w');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('in_progress');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [playerColor, setPlayerColor] = useState<Color>('w');

  // Time Control & Clocks
  const [timeControl, setTimeControl] = useState<TimeControlConfig>(initialTimeControl);
  const [whiteTime, setWhiteTime] = useState<number>(initialTimeControl.initialMinutes * 60);
  const [blackTime, setBlackTime] = useState<number>(initialTimeControl.initialMinutes * 60);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Compute King square if in check
  const getKingSquare = useCallback((color: Color): Square | null => {
    const board = chessRef.current.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return piece.square;
        }
      }
    }
    return null;
  }, []);

  const [checkSquare, setCheckSquare] = useState<Square | null>(null);

  // Calculate captured pieces & material advantage
  const getCapturedPieces = useCallback((): CapturedState => {
    const board = chessRef.current.board();
    const currentCounts: { w: Record<PieceSymbol, number>; b: Record<PieceSymbol, number> } = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          currentCounts[piece.color][piece.type]++;
        }
      }
    }

    const whiteCaptured: PieceSymbol[] = [];
    const blackCaptured: PieceSymbol[] = [];
    let whiteScore = 0;
    let blackScore = 0;

    (Object.keys(STARTING_PIECES) as PieceSymbol[]).forEach(type => {
      if (type === 'k') return;
      const missingBlack = STARTING_PIECES[type] - currentCounts.b[type];
      for (let i = 0; i < missingBlack; i++) {
        whiteCaptured.push(type);
      }
      const missingWhite = STARTING_PIECES[type] - currentCounts.w[type];
      for (let i = 0; i < missingWhite; i++) {
        blackCaptured.push(type);
      }

      whiteScore += currentCounts.w[type] * PIECE_VALUES[type];
      blackScore += currentCounts.b[type] * PIECE_VALUES[type];
    });

    return {
      whiteCaptured,
      blackCaptured,
      materialDifference: whiteScore - blackScore,
    };
  }, []);

  // Sync game status
  const updateStatus = useCallback(() => {
    const chess = chessRef.current;
    const currentTurn = chess.turn();
    setTurn(currentTurn);
    setFen(chess.fen());

    if (chess.isCheckmate()) {
      setIsGameOver(true);
      setGameStatus('checkmate');
      setCheckSquare(getKingSquare(currentTurn));
      setTimerActive(false);
      sounds.playGameOver();
    } else if (chess.isStalemate()) {
      setIsGameOver(true);
      setGameStatus('stalemate');
      setCheckSquare(null);
      setTimerActive(false);
      sounds.playGameOver();
    } else if (chess.isThreefoldRepetition()) {
      setIsGameOver(true);
      setGameStatus('threefold_repetition');
      setCheckSquare(null);
      setTimerActive(false);
      sounds.playGameOver();
    } else if (chess.isInsufficientMaterial()) {
      setIsGameOver(true);
      setGameStatus('insufficient_material');
      setCheckSquare(null);
      setTimerActive(false);
      sounds.playGameOver();
    } else if (chess.isDraw()) {
      setIsGameOver(true);
      setGameStatus('fifty_moves');
      setCheckSquare(null);
      setTimerActive(false);
      sounds.playGameOver();
    } else if (chess.inCheck()) {
      setIsGameOver(false);
      setGameStatus('check');
      setCheckSquare(getKingSquare(currentTurn));
      sounds.playCheck();
    } else {
      setIsGameOver(false);
      setGameStatus('in_progress');
      setCheckSquare(null);
    }
  }, [getKingSquare]);

  // Execute a validated move in chess.js
  const executeMove = useCallback((
    from: Square,
    to: Square,
    promotion?: PieceSymbol
  ): Move | null => {
    const chess = chessRef.current;

    try {
      const movingPiece = chess.get(from);
      if (!movingPiece) return null;

      const isCastle = movingPiece.type === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;
      const targetPiece = chess.get(to);
      const isCapture = !!targetPiece || (movingPiece.type === 'p' && from[0] !== to[0]);
      const prevTurn = chess.turn();

      const move = chess.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (!move) return null;

      // Add time increment to the player who just moved
      if (!timeControl.isUnlimited && timeControl.incrementSeconds > 0) {
        if (prevTurn === 'w') {
          setWhiteTime(t => t + timeControl.incrementSeconds);
        } else {
          setBlackTime(t => t + timeControl.incrementSeconds);
        }
      }

      // Audio feedback
      if (isCastle) {
        sounds.playCastle();
      } else if (isCapture) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }

      setLastMove({ from, to });
      setSelectedSquare(null);
      setLegalMoves([]);

      // Append to history
      const newRecord: MoveRecord = {
        san: move.san,
        from: move.from as Square,
        to: move.to as Square,
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        promotion: move.promotion,
        fenAfter: chess.fen(),
        moveNumber: Math.floor(chess.history().length / 2) + 1,
      };

      setHistory(prev => [...prev, newRecord]);

      // Clock begins ticking once the first move is made
      if (!timeControl.isUnlimited) {
        setTimerActive(true);
      }

      updateStatus();
      return move;
    } catch {
      return null;
    }
  }, [updateStatus, timeControl]);

  // Check if a move requires promotion selection
  const isPromotionMove = useCallback((from: Square, to: Square): boolean => {
    const chess = chessRef.current;
    const piece = chess.get(from);
    if (!piece || piece.type !== 'p') return false;

    // White pawn reaching rank 8 or Black pawn reaching rank 1
    const targetRank = to[1];
    if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
      // Must verify it is an actual legal move in chess.js
      const legalMoves = chess.moves({ square: from, verbose: true });
      return legalMoves.some(m => m.to === to && m.promotion);
    }

    return false;
  }, []);

  // Handle piece drop on board
  const onPieceDrop = useCallback((
    sourceSquare: Square,
    targetSquare: Square
  ): boolean => {
    if (isGameOver) return false;

    // Pawn promotion trigger
    if (isPromotionMove(sourceSquare, targetSquare)) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return true; // Keep piece placed while modal prompt appears
    }

    const move = executeMove(sourceSquare, targetSquare);
    return !!move;
  }, [isGameOver, isPromotionMove, executeMove]);

  // Handle square clicks for click-to-move
  const onSquareClick = useCallback((square: Square) => {
    if (isGameOver) return;

    const chess = chessRef.current;

    // If clicking a square that is an available destination for selected piece
    if (selectedSquare && legalMoves.includes(square)) {
      if (isPromotionMove(selectedSquare, square)) {
        setPendingPromotion({ from: selectedSquare, to: square });
        return;
      }
      executeMove(selectedSquare, square);
      return;
    }

    // Select piece matching current turn
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true }).map(m => m.to as Square);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [isGameOver, selectedSquare, legalMoves, isPromotionMove, executeMove]);

  // Complete pending promotion with chosen piece
  const completePromotion = useCallback((piece: PieceSymbol) => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
  }, [pendingPromotion, executeMove]);

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  // Undo moves (1 or 2 half-moves)
  const undoMove = useCallback((steps: number = 1): boolean => {
    const chess = chessRef.current;
    let undoneCount = 0;

    for (let i = 0; i < steps; i++) {
      const undone = chess.undo();
      if (undone) undoneCount++;
    }

    if (undoneCount > 0) {
      setHistory(prev => prev.slice(0, prev.length - undoneCount));
      const hist = chess.history({ verbose: true });
      if (hist.length > 0) {
        const last = hist[hist.length - 1];
        setLastMove({ from: last.from as Square, to: last.to as Square });
      } else {
        setLastMove(null);
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      setPendingPromotion(null);
      updateStatus();
      return true;
    }
    return false;
  }, [updateStatus]);

  // Resign match
  const resignGame = useCallback(() => {
    if (isGameOver) return;
    setIsGameOver(true);
    setGameStatus('resigned');
    setTimerActive(false);
    sounds.playGameOver();
  }, [isGameOver]);

  // Reset entire game with chosen color and time control
  const resetGame = useCallback((
    newPlayerColor: Color = playerColor,
    newTimeControl: TimeControlConfig = timeControl
  ) => {
    chessRef.current.reset();
    setFen(chessRef.current.fen());
    setHistory([]);
    setTurn('w');
    setIsGameOver(false);
    setGameStatus('in_progress');
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setCheckSquare(null);
    setPendingPromotion(null);
    setPlayerColor(newPlayerColor);
    setBoardOrientation(newPlayerColor === 'w' ? 'white' : 'black');
    setTimeControl(newTimeControl);
    setWhiteTime(newTimeControl.initialMinutes * 60);
    setBlackTime(newTimeControl.initialMinutes * 60);
    setTimerActive(false);
  }, [playerColor, timeControl]);

  // Flip board perspective
  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => (prev === 'white' ? 'black' : 'white'));
  }, []);

  // Switch time control setting
  const changeTimeControl = useCallback((newConfig: TimeControlConfig) => {
    setTimeControl(newConfig);
    setWhiteTime(newConfig.initialMinutes * 60);
    setBlackTime(newConfig.initialMinutes * 60);
  }, []);

  // Chess clock timer loop
  useEffect(() => {
    if (!timerActive || isGameOver || timeControl.isUnlimited) return;

    const interval = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            setIsGameOver(true);
            setGameStatus('timeout');
            setTimerActive(false);
            sounds.playGameOver();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            setIsGameOver(true);
            setGameStatus('timeout');
            setTimerActive(false);
            sounds.playGameOver();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, isGameOver, turn, timeControl.isUnlimited]);

  return {
    chess: chessRef.current,
    fen,
    turn,
    playerColor,
    setPlayerColor,
    history,
    isGameOver,
    gameStatus,
    selectedSquare,
    legalMoves,
    lastMove,
    checkSquare,
    boardOrientation,
    pendingPromotion,
    timeControl,
    whiteTime,
    blackTime,
    timerActive,
    captured: getCapturedPieces(),
    onPieceDrop,
    onSquareClick,
    executeMove,
    completePromotion,
    cancelPromotion,
    undoMove,
    resignGame,
    resetGame,
    flipBoard,
    setBoardOrientation,
    changeTimeControl,
    setTimerActive,
  };
}
