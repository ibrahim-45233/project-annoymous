import React from 'react';
import { Color } from 'chess.js';
import { Bot, User, Clock, ShieldCheck, Zap, Infinity } from 'lucide-react';

interface PlayerCardProps {
  name: string;
  isAi: boolean;
  color: Color;
  isActiveTurn: boolean;
  timeLeftSeconds: number;
  isUnlimitedTime?: boolean;
  isAiThinking?: boolean;
  ratingLabel?: string;
  depth?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  isAi,
  color,
  isActiveTurn,
  timeLeftSeconds,
  isUnlimitedTime,
  isAiThinking,
  ratingLabel,
  depth,
}) => {
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isLowTime = !isUnlimitedTime && timeLeftSeconds <= 30 && timeLeftSeconds > 0;

  return (
    <div
      className={`relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
        isActiveTurn
          ? 'bg-charcoal-800/95 border-cyan-500/60 shadow-glow-blue'
          : 'bg-charcoal-800/60 border-slate-700/50'
      }`}
    >
      {/* Active Turn Indicator Strip */}
      {isActiveTurn && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full" />
      )}

      {/* Avatar & Player Info */}
      <div className="flex items-center gap-3 pl-1.5">
        <div
          className={`relative flex items-center justify-center w-10 h-10 rounded-xl border shadow-inner ${
            isAi
              ? 'bg-gradient-to-br from-slate-800 to-cyan-950 border-cyan-500/40 text-cyan-400'
              : 'bg-gradient-to-br from-slate-800 to-indigo-950 border-indigo-500/40 text-indigo-400'
          }`}
        >
          {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}

          {/* Color Indicator Badge */}
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-charcoal-900 shadow-sm ${
              color === 'w' ? 'bg-white' : 'bg-slate-900'
            }`}
            title={color === 'w' ? 'Playing as White' : 'Playing as Black'}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs sm:text-sm text-slate-100">{name}</span>
            {isAi && (
              <span className="flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                <ShieldCheck className="w-2.5 h-2.5" />
                GM Engine
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {ratingLabel && (
              <span className="text-[11px] font-medium text-slate-400">
                {ratingLabel}
              </span>
            )}
            {isAi && depth !== undefined && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                <Zap className="w-2.5 h-2.5" />
                D{depth}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chess Clock Timer */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm tracking-wider ${
          isLowTime
            ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse'
            : isActiveTurn
              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-600/50'
              : 'bg-charcoal-700/60 text-slate-400 border-slate-700'
        }`}
      >
        {isUnlimitedTime ? (
          <>
            <Infinity className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-normal">Casual</span>
          </>
        ) : (
          <>
            <Clock className={`w-3.5 h-3.5 ${isActiveTurn ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{timeFormatted}</span>
          </>
        )}
      </div>
    </div>
  );
};
