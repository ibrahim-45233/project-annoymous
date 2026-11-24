import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Color, Square, PieceSymbol } from 'chess.js';
import { DifficultyConfig, DIFFICULTY_PRESETS, EngineEvaluation, EngineStatus, GameDifficulty, HintInfo } from '../types/chess';
import { stockfishEngine } from '../engine/stockfishService';
import { UciAdapter } from '../engine/uciAdapter';

interface UseStockfishProps {
  chess: Chess;
  fen: string;
  turn: Color;
  isGameOver: boolean;
  playerColor: Color;
  aiColor: Color;
  executeMove: (from: Square, to: Square, promotion?: PieceSymbol) => void;
}

export function useStockfish({
  chess,
  fen,
  turn,
  isGameOver,
  playerColor,
  aiColor,
  executeMove,
}: UseStockfishProps) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [customConfig, setCustomConfig] = useState<DifficultyConfig>({
    name: 'Custom',
    depth: 10,
    skillLevel: 12,
    moveTime: 1200,
    description: 'Custom user-defined search depth and calculation time.',
  });

  const [engineStatus, setEngineStatus] = useState<EngineStatus>({
    isReady: false,
    isThinking: false,
    isAnalyzing: false,
    isError: false,
    evalInfo: null,
  });

  const [isLiveAnalysisEnabled, setIsLiveAnalysisEnabled] = useState<boolean>(true);
  const [hintInfo, setHintInfo] = useState<HintInfo | null>(null);
  const [isCalculatingHint, setIsCalculatingHint] = useState<boolean>(false);

  // Active configuration based on preset or custom
  const currentConfig: DifficultyConfig = difficulty === 'custom'
    ? customConfig
    : DIFFICULTY_PRESETS[difficulty];

  // Subscribe to engine status updates
  useEffect(() => {
    stockfishEngine.setPlayerColor(playerColor);
    const unsubStatus = stockfishEngine.onStatus((status) => {
      setEngineStatus(status);
    });
    return () => unsubStatus();
  }, [playerColor]);

  // Sync engine difficulty level
  useEffect(() => {
    stockfishEngine.setDifficulty(currentConfig);
  }, [currentConfig]);

  // Keep ref of executeMove to avoid trigger loops
  const executeMoveRef = useRef(executeMove);
  executeMoveRef.current = executeMove;

  // Clear hint whenever the position changes
  useEffect(() => {
    setHintInfo(null);
  }, [fen]);

  // Sync FEN & coordinate AI turn or live analysis
  useEffect(() => {
    stockfishEngine.setCurrentFen(fen);

    if (isGameOver) {
      stockfishEngine.stop();
      return;
    }

    let isCancelled = false;

    if (turn === aiColor) {
      // 1. AI's turn to play: calculate move
      const triggerAiTurn = async () => {
        try {
          const bestMoveUci = await stockfishEngine.calculateBestMove(fen, currentConfig);
          if (isCancelled || !bestMoveUci || bestMoveUci === '(none)') return;

          const { from, to, promotion } = UciAdapter.uciToChessMove(bestMoveUci);
          executeMoveRef.current(from as Square, to as Square, promotion);
        } catch (err) {
          console.error('Stockfish move calculation failed:', err);
        }
      };

      const timer = setTimeout(triggerAiTurn, 220);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
        stockfishEngine.stop();
      };
    } else {
      // 2. Human's turn: if live analysis is enabled, run background evaluation
      if (isLiveAnalysisEnabled) {
        const timer = setTimeout(() => {
          if (!isCancelled) {
            stockfishEngine.startAnalysis(fen, 20);
          }
        }, 150);

        return () => {
          isCancelled = true;
          clearTimeout(timer);
          stockfishEngine.stop();
        };
      }
    }
  }, [fen, turn, aiColor, isGameOver, isLiveAnalysisEnabled, currentConfig]);

  // Toggle live analysis
  const toggleLiveAnalysis = useCallback(() => {
    setIsLiveAnalysisEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stockfishEngine.stop();
      } else if (!isGameOver && turn !== aiColor) {
        stockfishEngine.startAnalysis(fen, 20);
      }
      return next;
    });
  }, [fen, isGameOver, turn, aiColor]);

  // Manual on-demand analysis trigger
  const analyzeCurrentPosition = useCallback(() => {
    if (isGameOver) return;
    stockfishEngine.startAnalysis(fen, 22);
  }, [fen, isGameOver]);

  // Request a hint without altering the game position
  const requestHint = useCallback(async () => {
    if (isGameOver || engineStatus.isThinking || isCalculatingHint) return;

    try {
      setIsCalculatingHint(true);
      const hintUci = await stockfishEngine.calculateBestMove(fen, {
        name: 'Hint Analysis',
        depth: Math.max(8, currentConfig.depth),
        skillLevel: 20, // Grandmaster precision for hint
        moveTime: 1200,
        description: 'Deep engine positional hint calculation',
      });

      if (hintUci && hintUci !== '(none)') {
        const { from, to, promotion } = UciAdapter.uciToChessMove(hintUci);

        // Find matching SAN in legal moves
        const legal = chess.moves({ square: from as Square, verbose: true });
        const matched = legal.find((m) => m.to === to);
        const san = matched ? matched.san : `${from}-${to}`;

        const scoreDisplay = engineStatus.evalInfo
          ? UciAdapter.formatScore(
              engineStatus.evalInfo.scoreCp,
              engineStatus.evalInfo.scoreMate,
              turn
            )
          : undefined;

        setHintInfo({
          from: from as Square,
          to: to as Square,
          san,
          promotion,
          scoreDisplay,
        });
      }
    } catch (err) {
      console.error('Hint calculation failed:', err);
    } finally {
      setIsCalculatingHint(false);
    }
  }, [
    fen,
    turn,
    isGameOver,
    engineStatus.isThinking,
    engineStatus.evalInfo,
    isCalculatingHint,
    currentConfig.depth,
    chess,
  ]);

  const dismissHint = useCallback(() => {
    setHintInfo(null);
  }, []);

  const applyHint = useCallback(() => {
    if (!hintInfo || isGameOver || turn === aiColor) return;
    executeMove(hintInfo.from, hintInfo.to, hintInfo.promotion);
    setHintInfo(null);
  }, [hintInfo, isGameOver, turn, aiColor, executeMove]);

  // Play suggested best move from analysis panel
  const playBestMove = useCallback(
    (uciMove: string) => {
      if (!uciMove || isGameOver || turn === aiColor) return;
      const { from, to, promotion } = UciAdapter.uciToChessMove(uciMove);
      executeMove(from as Square, to as Square, promotion);
    },
    [isGameOver, turn, aiColor, executeMove]
  );

  const stopThinking = useCallback(() => {
    stockfishEngine.stop();
    setHintInfo(null);
  }, []);

  const resetEngine = useCallback(() => {
    stockfishEngine.newGame();
    setHintInfo(null);
  }, []);

  const restartWorker = useCallback(() => {
    stockfishEngine.initWorker();
    setHintInfo(null);
  }, []);

  return {
    difficulty,
    setDifficulty,
    customConfig,
    setCustomConfig,
    currentConfig,
    engineStatus,
    evalInfo: engineStatus.evalInfo,
    isAiThinking: engineStatus.isThinking && turn === aiColor,
    isAnalyzing: engineStatus.isAnalyzing,
    isLiveAnalysisEnabled,
    toggleLiveAnalysis,
    analyzeCurrentPosition,
    isCalculatingHint,
    hintInfo,
    requestHint,
    dismissHint,
    applyHint,
    playBestMove,
    stopThinking,
    resetEngine,
    restartWorker,
  };
}
