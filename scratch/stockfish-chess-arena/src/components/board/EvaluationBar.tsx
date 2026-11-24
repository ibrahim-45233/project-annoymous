import React from 'react';
import { EngineEvaluation } from '../../types/chess';
import { UciAdapter } from '../../engine/uciAdapter';

interface EvaluationBarProps {
  evalInfo: EngineEvaluation | null;
  boardOrientation: 'white' | 'black';
  isThinkingOrAnalyzing: boolean;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evalInfo,
  boardOrientation,
  isThinkingOrAnalyzing,
}) => {
  // If no evalInfo yet, default to 50% (equal)
  const whitePercent = evalInfo?.winPercentageWhite !== undefined
    ? evalInfo.winPercentageWhite
    : 50;

  // Format display text
  const { whiteDisplay, isMate } = UciAdapter.formatNormalizedScore(evalInfo);

  // If orientation is white: white is on bottom, black is on top
  // If orientation is black: black is on bottom, white is on top
  const bottomColor = boardOrientation === 'white' ? 'w' : 'b';
  const bottomPercent = bottomColor === 'w' ? whitePercent : 100 - whitePercent;
  const topPercent = 100 - bottomPercent;

  // Determine which side is winning to position the score badge
  const isWhiteWinning = whitePercent > 50;
  const isBlackWinning = whitePercent < 50;
  const isScoreOnBottom = bottomColor === 'w' ? isWhiteWinning : isBlackWinning;

  // Score label to show inside the winning portion
  let scoreBadgeText = whiteDisplay;
  if (!evalInfo || (evalInfo.whiteCp === undefined && evalInfo.whiteMate === undefined)) {
    scoreBadgeText = isThinkingOrAnalyzing ? '...' : '0.0';
  }

  const tooltipText = evalInfo
    ? evalInfo.whiteMate !== undefined
      ? `Mate in ${Math.abs(evalInfo.whiteMate)} (${evalInfo.whiteMate > 0 ? 'White' : 'Black'})`
      : `Score: ${evalInfo.whiteCp !== undefined ? `${evalInfo.whiteCp > 0 ? '+' : ''}${evalInfo.whiteCp} cp` : '0 cp'} (Depth ${evalInfo.depth})`
    : 'Waiting for engine evaluation...';

  return (
    <div
      className="relative flex flex-col h-full w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-700/70 shadow-lg select-none min-h-[300px]"
      title={tooltipText}
    >
      {/* Top Portion */}
      <div
        className={`w-full transition-all duration-500 ease-out flex flex-col justify-start items-center relative overflow-hidden ${
          bottomColor === 'w'
            ? 'bg-[#18202f] text-slate-100' // Black on top
            : 'bg-[#e2e8f0] text-slate-900' // White on top
        }`}
        style={{ height: `${topPercent}%` }}
      >
        {/* Score label if winning side is on top */}
        {!isScoreOnBottom && (
          <span
            className={`text-[10px] sm:text-[11px] font-mono font-extrabold pt-1.5 px-0.5 tracking-tight ${
              isMate ? 'text-amber-300 font-black' : ''
            }`}
          >
            {scoreBadgeText}
          </span>
        )}
      </div>

      {/* Center 50% Equality Line */}
      <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-cyan-500/40 z-10 pointer-events-none" />

      {/* Bottom Portion */}
      <div
        className={`w-full transition-all duration-500 ease-out flex flex-col justify-end items-center relative overflow-hidden ${
          bottomColor === 'w'
            ? 'bg-[#e2e8f0] text-slate-900' // White on bottom
            : 'bg-[#18202f] text-slate-100' // Black on bottom
        }`}
        style={{ height: `${bottomPercent}%` }}
      >
        {/* Score label if winning side is on bottom or dead equal */}
        {(isScoreOnBottom || whitePercent === 50) && (
          <span
            className={`text-[10px] sm:text-[11px] font-mono font-extrabold pb-1.5 px-0.5 tracking-tight ${
              isMate ? 'text-amber-600 font-black' : ''
            }`}
          >
            {scoreBadgeText}
          </span>
        )}
      </div>

      {/* Subtle calculating shimmer */}
      {isThinkingOrAnalyzing && (
        <div className="absolute inset-0 bg-cyan-400/10 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};
