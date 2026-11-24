import React, { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Square, Chess } from 'chess.js';
import { EngineEvaluation, HintInfo } from '../../types/chess';
import { EvaluationBar } from './EvaluationBar';
import { Lightbulb, Play, X } from 'lucide-react';

interface ChessboardContainerProps {
  fen: string;
  boardOrientation: 'white' | 'black';
  isAiThinking: boolean;
  isAnalyzing: boolean;
  isGameOver: boolean;
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  checkSquare: Square | null;
  hintInfo: HintInfo | null;
  evalInfo: EngineEvaluation | null;
  chess: Chess;
  onPieceDrop: (source: Square, target: Square) => boolean;
  onSquareClick: (square: Square) => void;
  onApplyHint?: () => void;
  onDismissHint?: () => void;
}

export const ChessboardContainer: React.FC<ChessboardContainerProps> = ({
  fen,
  boardOrientation,
  isAiThinking,
  isAnalyzing,
  isGameOver,
  selectedSquare,
  legalMoves,
  lastMove,
  checkSquare,
  hintInfo,
  evalInfo,
  chess,
  onPieceDrop,
  onSquareClick,
  onApplyHint,
  onDismissHint,
}) => {
  // Build highlight styles for squares
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Last move highlights (Soft subtle blue/indigo)
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: 'rgba(99, 102, 241, 0.28)',
      };
      styles[lastMove.to] = {
        backgroundColor: 'rgba(99, 102, 241, 0.42)',
      };
    }

    // 2. Selected square highlight (Sleek cyan)
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(6, 182, 212, 0.45)',
        boxShadow: 'inset 0 0 10px rgba(6, 182, 212, 0.6)',
      };
    }

    // 3. Legal move targets (Dot for quiet move, ring for capture)
    legalMoves.forEach(sq => {
      const pieceOnSquare = chess.get(sq);
      if (pieceOnSquare) {
        // Capture square: red/cyan target ring
        styles[sq] = {
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 65%, rgba(239, 68, 68, 0.6) 70%, transparent 72%)',
          borderRadius: '4px',
          cursor: 'pointer',
        };
      } else {
        // Quiet move square: subtle glowing center dot
        styles[sq] = {
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.7) 22%, transparent 26%)',
          borderRadius: '50%',
          cursor: 'pointer',
        };
      }
    });

    // 4. Check square: King under attack (Vivid pulsating red glow)
    if (checkSquare) {
      styles[checkSquare] = {
        background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.85) 0%, rgba(220, 38, 38, 0.5) 60%, transparent 100%)',
        boxShadow: '0 0 20px 4px rgba(239, 68, 68, 0.7)',
      };
    }

    // 5. Hint move highlight (Emerald green)
    if (hintInfo) {
      styles[hintInfo.from] = {
        backgroundColor: 'rgba(16, 185, 129, 0.4)',
        boxShadow: 'inset 0 0 10px rgba(16, 185, 129, 0.9)',
      };
      styles[hintInfo.to] = {
        backgroundColor: 'rgba(16, 185, 129, 0.55)',
        boxShadow: 'inset 0 0 12px rgba(16, 185, 129, 1)',
      };
    }

    return styles;
  }, [lastMove, selectedSquare, legalMoves, checkSquare, hintInfo, chess]);

  return (
    <div className="flex items-stretch gap-2 sm:gap-3.5 w-full max-w-[620px] justify-center">
      {/* 1. Vertical Evaluation Bar Beside Chessboard */}
      <div className="w-6 sm:w-8 flex flex-col justify-center py-2 shrink-0">
        <EvaluationBar
          evalInfo={evalInfo}
          boardOrientation={boardOrientation}
          isThinkingOrAnalyzing={isAiThinking || isAnalyzing}
        />
      </div>

      {/* 2. Responsive Interactive Chessboard */}
      <div className="relative flex-1 aspect-square select-none flex flex-col items-center justify-center">
        {/* Outer Glow & Ambient Bezel */}
        <div className={`absolute -inset-1 rounded-2xl transition-all duration-500 blur-md ${
          isAiThinking 
            ? 'bg-cyan-500/25 animate-pulse'
            : checkSquare 
              ? 'bg-rose-500/30' 
              : hintInfo
                ? 'bg-emerald-500/25 animate-pulse'
                : 'bg-slate-700/20'
        }`} />

        <div className="relative w-full h-full bg-[#1b2230] p-2.5 sm:p-3 rounded-2xl shadow-board border border-slate-700/60 overflow-hidden flex items-center justify-center">
          <Chessboard
            position={fen}
            boardOrientation={boardOrientation}
            onPieceDrop={(source, target) => {
              if (isAiThinking || isGameOver) return false;
              return onPieceDrop(source as Square, target as Square);
            }}
            onSquareClick={(square) => {
              if (isAiThinking || isGameOver) return;
              onSquareClick(square as Square);
            }}
            arePiecesDraggable={!isAiThinking && !isGameOver}
            animationDuration={220}
            customBoardStyle={{
              borderRadius: '10px',
              boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.65)',
            }}
            customDarkSquareStyle={{
              backgroundColor: '#2b3648',
            }}
            customLightSquareStyle={{
              backgroundColor: '#576a85',
            }}
            customSquareStyles={customSquareStyles}
          />

          {/* AI Thinking Overlay Badge */}
          {isAiThinking && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-charcoal-900/90 border border-cyan-500/50 shadow-glow-cyan backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-cyan-300 uppercase">
                Stockfish is calculating...
              </span>
            </div>
          )}

          {/* Floating Hint Suggestion Pill */}
          {hintInfo && !isAiThinking && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-charcoal-900/95 border border-emerald-500/70 shadow-lg backdrop-blur-md text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Lightbulb className="w-4 h-4 animate-bounce" />
                <span>Hint: <span className="font-extrabold text-white text-sm">{hintInfo.san}</span></span>
                <span className="text-slate-400 font-mono text-[11px]">({hintInfo.from} → {hintInfo.to})</span>
              </div>

              {hintInfo.scoreDisplay && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {hintInfo.scoreDisplay}
                </span>
              )}

              {onApplyHint && (
                <button
                  onClick={onApplyHint}
                  className="flex items-center gap-1 ml-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-sm"
                  title="Play this suggested move directly"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play Move</span>
                </button>
              )}

              {onDismissHint && (
                <button
                  onClick={onDismissHint}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Dismiss hint"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
