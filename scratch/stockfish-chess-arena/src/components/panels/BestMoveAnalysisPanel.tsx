import React, { useState } from 'react';
import { Color } from 'chess.js';
import { EngineEvaluation } from '../../types/chess';
import { UciAdapter } from '../../engine/uciAdapter';
import {
  Sparkles,
  TrendingUp,
  Cpu,
  Play,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface BestMoveAnalysisPanelProps {
  evalInfo: EngineEvaluation | null;
  isAnalyzing: boolean;
  isThinking: boolean;
  isLiveAnalysisEnabled: boolean;
  playerColor: Color;
  turn: Color;
  onToggleLiveAnalysis: () => void;
  onAnalyzeCurrentPosition: () => void;
  onPlayBestMove?: (uciMove: string) => void;
}

export const BestMoveAnalysisPanel: React.FC<BestMoveAnalysisPanelProps> = ({
  evalInfo,
  isAnalyzing,
  isThinking,
  isLiveAnalysisEnabled,
  playerColor,
  turn,
  onToggleLiveAnalysis,
  onAnalyzeCurrentPosition,
  onPlayBestMove,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const { whiteDisplay, playerDisplay, advantageText, isMate } =
    UciAdapter.formatNormalizedScore(evalInfo);

  const isCalculating = isThinking || isAnalyzing;
  const bestMove = evalInfo?.bestMove;
  const bestMoveSan = evalInfo?.bestMoveSan || bestMove;
  const pvFormatted = evalInfo?.pvFormatted || [];

  return (
    <div className="bg-charcoal-800/80 border border-slate-700/70 rounded-2xl p-3.5 sm:p-4 shadow-xl transition-all">
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Stockfish Engine Analysis</span>
              {isCalculating && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              )}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              Real-time WebAssembly evaluation & PV line
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Live Analysis Toggle Pill */}
          <button
            onClick={onToggleLiveAnalysis}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              isLiveAnalysisEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-glow-cyan'
                : 'bg-charcoal-700/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={
              isLiveAnalysisEnabled
                ? 'Live auto-analysis enabled'
                : 'Live auto-analysis paused'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveAnalysisEnabled ? 'bg-cyan-400' : 'bg-slate-500'
              }`}
            />
            <span>Live: {isLiveAnalysisEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3.5">
          {/* Evaluation Score & Advantage Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* White Evaluation / Centipawns */}
            <div className="p-3 rounded-xl bg-charcoal-900/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Overall Eval (White)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-xl font-extrabold font-mono tracking-tight ${
                    isMate
                      ? 'text-amber-400'
                      : whiteDisplay.startsWith('+')
                        ? 'text-cyan-400'
                        : whiteDisplay.startsWith('-')
                          ? 'text-indigo-400'
                          : 'text-slate-200'
                  }`}
                >
                  {evalInfo ? whiteDisplay : '0.00'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {isMate ? 'mate' : 'pawns'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                {advantageText}
              </span>
            </div>

            {/* Player's Perspective Score */}
            <div className="p-3 rounded-xl bg-charcoal-900/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Your Advantage ({playerColor === 'w' ? 'White' : 'Black'})
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-xl font-extrabold font-mono tracking-tight ${
                    isMate
                      ? (evalInfo?.playerMate || 0) > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                      : (evalInfo?.playerCp || 0) > 0
                        ? 'text-emerald-400'
                        : (evalInfo?.playerCp || 0) < 0
                          ? 'text-rose-400'
                          : 'text-slate-200'
                  }`}
                >
                  {evalInfo ? playerDisplay : '0.00'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {isMate ? 'mate' : 'pawns'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                {evalInfo
                  ? (evalInfo.playerCp || 0) > 0
                    ? 'You have advantage'
                    : (evalInfo.playerCp || 0) < 0
                      ? 'Opponent has advantage'
                      : 'Dead equal'
                  : 'Evaluating...'}
              </span>
            </div>
          </div>

          {/* Best Move Suggestion */}
          <div className="p-3 rounded-xl bg-charcoal-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Suggested Best Move
                </span>
                {bestMove ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-extrabold text-white font-mono">
                      {bestMoveSan}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({bestMove.slice(0, 2)} → {bestMove.slice(2, 4)})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    {isCalculating ? 'Stockfish searching best line...' : 'Click analyze to calculate'}
                  </span>
                )}
              </div>
            </div>

            {/* Play Best Move Button (enabled on player's turn) */}
            {bestMove && onPlayBestMove && turn === playerColor && (
              <button
                onClick={() => onPlayBestMove(bestMove)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm active:scale-95"
                title="Play this best move automatically"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </button>
            )}
          </div>

          {/* Principal Variation (PV Continuation Line) */}
          <div className="p-3 rounded-xl bg-charcoal-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Expected Continuation (PV)</span>
              </span>
              {evalInfo && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Depth {evalInfo.depth} ply
                </span>
              )}
            </div>

            {pvFormatted.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {pvFormatted.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-charcoal-800 border border-slate-700/60 text-slate-200"
                  >
                    <span className="text-slate-500 text-[10px]">
                      {item.color === 'w' ? `${item.moveNumber}.` : `${item.moveNumber}...`}
                    </span>
                    <span className="font-semibold text-slate-100">{item.san}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {isCalculating
                  ? 'Computing continuation line...'
                  : 'PV line will appear once engine reaches depth 1+.'}
              </p>
            )}
          </div>

          {/* Engine Search Telemetry Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 px-1">
            <div className="flex items-center gap-3">
              <span>
                Nodes: <strong className="text-slate-200">{evalInfo?.nodes ? evalInfo.nodes.toLocaleString() : '0'}</strong>
              </span>
              <span>
                Speed: <strong className="text-slate-200">{evalInfo?.nps ? `${Math.round(evalInfo.nps / 1000)} kN/s` : '0'}</strong>
              </span>
            </div>

            {!isLiveAnalysisEnabled && (
              <button
                onClick={onAnalyzeCurrentPosition}
                disabled={isCalculating}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
              >
                <RotateCw className={`w-3 h-3 ${isCalculating ? 'animate-spin' : ''}`} />
                <span>{isCalculating ? 'Analyzing' : 'Analyze Now'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
